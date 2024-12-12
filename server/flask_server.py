import os
import cv2
import numpy as np
from flask import Flask, Response, request, jsonify,render_template
from flask_cors import CORS
import json
from PIL import Image
import base64
import logging
from firebase_admin import credentials,db
import firebase_admin
import time
import matplotlib.pyplot as plt
import shutil

app = Flask(__name__)
CORS(app)

lane_info_global = []

# Initialize Firebase Admin SDK
cred = credentials.Certificate(r'C:\A STUDY\3rd year\5th sem\mini project\app_using_rect\flask-server\sarathi.json')
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://sarathi-e2f6c-default-rtdb.firebaseio.com/'
})

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

from ultralytics import YOLO

# Load the YOLOv8 pothole detection model
pothole_model_path = r'C:\A STUDY\3rd year\5th sem\mini project\test\best.pt'
pothole_model = YOLO(pothole_model_path, task='detect')
pothole_class_names = pothole_model.names


# Define models folder
MODELS_FOLDER = 'models'
TEST_FOLDER = 'test'

if not os.path.exists(MODELS_FOLDER):
    os.makedirs(MODELS_FOLDER)


# Function to upload pothole data to Firebase
def upload_damage_info_to_firebase(pothole_info):
    try:
        ref = db.reference('/pothole_data')
        ref.push(pothole_info)
        logging.info("Pothole data uploaded to Firebase successfully.")
    except Exception as e:
        logging.error(f"Error uploading pothole data to Firebase: {str(e)}")



# Function to upload lane data to Firebase
def upload_lane_info_to_firebase(lane_info):
    try:
        # Upload the lane info to Firebase Realtime Database
        ref = db.reference('/lane_data')
        ref.push(lane_info)
        logging.info("Lane data uploaded to Firebase successfully.")
    except Exception as e:
        logging.error(f"Error uploading lane data to Firebase: {str(e)}")

# Helper function to calculate distance from lane
def calculate_distance_from_lane(reference_point, line):
    """Calculate the perpendicular distance from the reference point to a line."""
    x1, y1, x2, y2 = line
    A = y2 - y1
    B = x1 - x2
    C = x2 * y1 - x1 * y2

    x_ref, y_ref = reference_point
    distance = abs(A * x_ref + B * y_ref + C) / np.sqrt(A**2 + B**2)
    return distance

# Decision logic for lane distance
def decision_based_on_distance(distance):
    """Make a decision based on lane distance."""
    if distance < 450:  # Safe range (adjust based on your scenario)
        return "Safe"
    elif 450 <= distance < 500:  # Caution range (adjust as needed)
        return "Caution"
    else:
        return "Dangerous"

# Lane detection and distance calculation with decision making
def process_frame_lane(frame):
    gray_image = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    blurred_image = cv2.GaussianBlur(gray_image, (5, 5), 2)
    edges = cv2.Canny(blurred_image, 50, 150)
    lines = cv2.HoughLinesP(edges, 1, np.pi / 180, 100, minLineLength=300, maxLineGap=20)
    line_image = np.zeros_like(frame)
    height, width, _ = frame.shape
    reference_point = (width // 2, height)  # Bottom-center of the frame

    lane_info = [] 
    if lines is not None:
        # List to store the distances and coordinates of all detected lines
        lines_with_distances = []
        
        for line in lines:
            for x1, y1, x2, y2 in line:
                # Calculate the distance from the reference point (bottom-center)
                distance = calculate_distance_from_lane(reference_point, (x1, y1, x2, y2))
                lines_with_distances.append({
                    "coordinates": [(x1, y1), (x2, y2)],
                    "distance": distance
                })

        # Sort the lines by distance (ascending), and take the top 2
        lines_with_distances = sorted(lines_with_distances, key=lambda x: x['distance'])
        top_2_lines = lines_with_distances[:2]

        # Process all detected lanes: draw all on the image
        for line in lines:
            for x1, y1, x2, y2 in line:
                cv2.line(line_image, (x1, y1), (x2, y2), (255, 0, 0), 5)

        # Process only the top 2 lanes for text information
        for i, line_info in enumerate(top_2_lines):
            x1, y1 = line_info['coordinates'][0]
            x2, y2 = line_info['coordinates'][1]
            distance = line_info['distance']
            decision = decision_based_on_distance(distance)
            
            coordinates_str = f"({x1}, {y1}) -> ({x2}, {y2})"
            # Add lane information to the list that will be rendered later
            lane_info.append({
                "coordinates": coordinates_str,  # Store the string representation of the coordinates
                "distance": str(distance),
                "decision": decision,
            })

            lane_info_global.append(lane_info)

            # Debugging: Displaying distances and decisions on the frame
            cv2.putText(frame, f"Lane {i}: {distance:.2f} ({decision})", 
                        (50, 50 + i * 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        
    
    combined_image = cv2.addWeighted(frame, 0.8, line_image, 1, 0)
    return combined_image, lane_info


# Video processing generator
def generate_video_lane(file_path, process_function):
    cap = cv2.VideoCapture(file_path)
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                # After processing ends, upload the lane_info_global to Firebase
                if lane_info_global:
                    upload_lane_info_to_firebase(lane_info_global)
                yield "event: end\n"
                yield "data: end\n\n"
                break

            frame, lane_info = process_function(frame)

            # Encode frame and yield as a response
            _, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()

            # Yield the frame as an event stream
            yield f"data: {frame_bytes.hex()}\n\n"
    finally:
        cap.release()

def process_frame_pothole(frame):
    """
    Detect potholes in the frame using YOLOv8 model and annotate them.
    """
    results = pothole_model.predict(frame, conf=0.25)  # Adjust confidence threshold
    detections = []

    if results:
        for r in results:
            boxes = r.boxes

            if boxes is not None:
                for box in boxes.data.cpu().numpy():
                    x1, y1, x2, y2, conf, cls = box
                    label = f'{pothole_class_names[int(cls)]}: {conf:.2f}'
                    
                    # Draw bounding boxes and labels on the frame
                    cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (255, 0, 0), 2)
                    cv2.putText(frame, label, (int(x1), int(y1) - 10), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
                    
                    # Save detection details for further use
                    detections.append({
                        "class": str(pothole_class_names[int(cls)]),
                        "confidence": str(round(conf, 2)),
                    })

    return frame, detections

def generate_video_damage(file_path, process_function):
    """
    Process a video for damage detection and yield frames as a response stream.
    """
    cap = cv2.VideoCapture(file_path)
    
    try:
        damage_info_global = []  # Store information about detected damages

        while True:
            ret, frame = cap.read()
            if not ret:
                # After processing ends, upload the damage_info_global to Firebase if needed
                if damage_info_global:
                    upload_damage_info_to_firebase(damage_info_global)
                yield "event: end\n"
                yield "data: end\n\n"
                break

            # Process the frame for damage detection
            frame, damage_info = process_function(frame)

            # Store the damage information
            damage_info_global.append(damage_info)

            # Encode frame and yield as a response
            _, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()

            # Yield the frame as an event stream
            yield f"data: {frame_bytes.hex()}\n\n"
    finally:
        cap.release()



@app.route('/')
def home():
    return render_template('index.html')


@app.route('/upload/lane', methods=['POST'])
def upload_lane_video():
    if 'video' not in request.files:
        return jsonify({"error": "No video file provided"}), 400

    file = request.files['video']
    if file.filename == '':
        return jsonify({"error": "No video file selected"}), 400

    file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(file_path)

    return jsonify({"file_path": file_path})

# Stream lane detection frames
@app.route('/stream/lane/uploads/<file_name>')
def stream_lane_video(file_name):
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], file_name)
    
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404
    
    return Response(generate_video_lane(file_path, process_frame_lane), mimetype='text/event-stream')

@app.route('/process/frame', methods=['POST'])
def process_frame():
    """
    Receives a single frame from the frontend as base64 or binary,
    processes it for lane detection, and sends back the processed frame.
    """
    try:
        # Parse the incoming frame
        if 'frame' not in request.files:
            return jsonify({"error": "No frame provided"}), 400

        # Retrieve the file
        frame_file = request.files['frame']
        frame_bytes = frame_file.read()

        if not frame_bytes:
            return jsonify({"error": "Empty frame data"}), 400

        # Convert the file to a numpy array for processing
        file_bytes = np.frombuffer(frame_bytes, np.uint8)
        frame = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        if frame is None:
            return jsonify({"error": "Invalid frame data or decoding failed"}), 400

        # Process the frame for lane detection
        processed_frame, lane_info = process_frame_lane(frame)

        # Encode the processed frame as JPEG
        ret, buffer = cv2.imencode('.jpg', processed_frame)
        if not ret:
            return jsonify({"error": "Failed to encode processed frame"}), 500

        # Convert the frame to base64 to send back as JSON
        processed_frame_base64 = base64.b64encode(buffer).decode('utf-8')

        # Log additional information for debugging purposes
        logging.debug(f"Processed frame size: {len(frame_bytes)} bytes")

        # Return the processed frame and lane information
        return jsonify({
            "processed_frame": processed_frame_base64,
            "lane_info": lane_info
        })

    except Exception as e:
        logging.error(f"Error processing frame: {str(e)}")
        return jsonify({"error": str(e)}), 500
    

@app.route('/upload/Damage', methods=['POST'])
def upload_pothole_video():
    if 'video' not in request.files:
        return jsonify({"error": "No video file provided"}), 400

    file = request.files['video']
    if file.filename == '':
        return jsonify({"error": "No video file selected"}), 400

    file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(file_path)

    return jsonify({"file_path": file_path})


# Stream pothole detection frames
@app.route('/stream/Damage/uploads/<file_name>')
def stream_pothole_video(file_name):
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], file_name)

    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404
    
    return Response(generate_video_damage(file_path, process_frame_pothole), mimetype='text/event-stream')

@app.route('/process/damage-frame', methods=['POST'])
def process_Damage_frame():
    """
    Receives a single frame from the frontend as base64 or binary,
    processes it for lane detection, and sends back the processed frame.
    """
    try:
        # Parse the incoming frame
        if 'frame' not in request.files:
            return jsonify({"error": "No frame provided"}), 400

        # Retrieve the file
        frame_file = request.files['frame']
        frame_bytes = frame_file.read()

        if not frame_bytes:
            return jsonify({"error": "Empty frame data"}), 400

        # Convert the file to a numpy array for processing
        file_bytes = np.frombuffer(frame_bytes, np.uint8)
        frame = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        if frame is None:
            return jsonify({"error": "Invalid frame data or decoding failed"}), 400

        # Process the frame for lane detection
        processed_frame, lane_info = process_frame_pothole(frame)

        # Encode the processed frame as JPEG
        ret, buffer = cv2.imencode('.jpg', processed_frame)
        if not ret:
            return jsonify({"error": "Failed to encode processed frame"}), 500

        # Convert the frame to base64 to send back as JSON
        processed_frame_base64 = base64.b64encode(buffer).decode('utf-8')

        # Log additional information for debugging purposes
        logging.debug(f"Processed frame size: {len(frame_bytes)} bytes")

        # Return the processed frame and lane information
        return jsonify({
            "processed_frame": processed_frame_base64,
            "lane_info": lane_info
        })

    except Exception as e:
        logging.error(f"Error processing frame: {str(e)}")
        return jsonify({"error": str(e)}), 500
    

@app.route("/api/get-markers", methods=["GET"])
def get_markers():
    ref = db.reference("/markers")
    markers_data = ref.get() or {}  # Fetch markers data, default to empty dictionary if none
    markers = []

    # Iterate over the markers and extract latitude and longitude
    for key, value in markers_data.items():
        if "latitude" in value and "longitude" in value:
            # Ensure the lat and lng are numbers (float) for the frontend
            marker = {
                "latitude": float(value["latitude"]),
                "longitude": float(value["longitude"]),
            }
            markers.append(marker)

    return jsonify({"markers": markers})


@app.route("/api/upload-image", methods=["POST"])
def upload_image():
    try:
        image_file = request.files["image"]
        latitude = request.form["latitude"]
        longitude = request.form["longitude"]

        # Read image
        img = np.frombuffer(image_file.read(), np.uint8)
        frame = cv2.imdecode(img, cv2.IMREAD_COLOR)

        # Detect road damage
        results = pothole_model.predict(frame, conf=0.25)
        damages = results[0].boxes.data if len(results) > 0 else []

        # Process results
        is_damaged = len(damages) > 0

        if is_damaged:
            for box in damages:
                x1, y1, x2, y2, conf, cls = box
                cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (255, 0, 0), 2)

            # Save marker to Firebase
            ref = db.reference("/markers")
            ref.push({"latitude": latitude, "longitude": longitude})

        _, buffer = cv2.imencode(".jpg", frame)
        processed_frame = base64.b64encode(buffer).decode("utf-8")

        return jsonify({"isDamaged": is_damaged, "processedFrame": processed_frame})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Function to clear the 'runs/detect' directory before saving new images
def clear_detection_folder():
    detect_folder = "runs/detect"
    if os.path.exists(detect_folder):
        shutil.rmtree(detect_folder)  # Remove all contents in the directory
    os.makedirs(detect_folder)  # Recreate the directory to store new images

@app.route('/upload-model', methods=['POST'])
def upload_model():
    try:
        if 'model' not in request.files:
            return jsonify({"error": "No model file provided"}), 400

        model_file = request.files['model']
        if model_file.filename == '':
            return jsonify({"error": "No model file selected"}), 400

        # Save the model file
        model_path = os.path.join(MODELS_FOLDER, model_file.filename)
        model_file.save(model_path)

        # Clear the 'runs/detect' folder before starting a new detection
        clear_detection_folder()

        # Load the model
        model = YOLO(model_path)

        # Path to dataset.yaml
        dataset_yaml_path = os.path.abspath("data.yaml")  # Replace with the actual path to your YAML file

        # Perform validation
        results = model.val(data=dataset_yaml_path, save=True)

        return jsonify({
            "message": "Model uploaded and tested successfully. Validation complete."
        })

    except Exception as e:
        logging.error(f"Error in upload_model: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

# Define the folder paths
VAL_FOLDER = 'runs/detect/val'

# Fetch and return the validation images
@app.route('/fetch-validation-images', methods=['GET'])
def fetch_validation_images():
    try:
        # Get all images from the 'runs/detect/val' folder
        if not os.path.exists(VAL_FOLDER):
            return jsonify({"error": "Validation folder not found"}), 400
        
        image_paths = [os.path.join(VAL_FOLDER, f) for f in os.listdir(VAL_FOLDER) if f.endswith(('.jpg', '.png', '.jpeg'))]

        # Convert images to base64 to send to frontend
        image_b64 = []
        for image_path in image_paths:
            with open(image_path, "rb") as image_file:
                encoded_image = base64.b64encode(image_file.read()).decode('utf-8')
                image_b64.append(encoded_image)

        return jsonify({
            "images": image_b64  # Return base64 encoded images
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500



if __name__ == '__main__':
    app.run(debug=True)
