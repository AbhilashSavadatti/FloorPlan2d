from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from ultralytics import YOLO
import torch
import cv2
import numpy as np
import os
import helper
from werkzeug.utils import secure_filename

app = Flask(__name__, static_folder='static')
CORS(app)  
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  


os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)


model = None
def load_model():
    global model
    model = YOLO('best.pt', task='detect')

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/detect', methods=['POST'])
def detect_objects():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file:
        
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
        
            img = cv2.imread(filepath)
            if img is None:
                return jsonify({'error': 'Could not read image'}), 400
                
            
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
            
            results = model(img_rgb, conf=0.5)  
            
        
            detections = []
            for result in results:
                for box in result.boxes:
                    label = model.names[int(box.cls)]
                    conf = float(box.conf)
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    
                    detections.append({
                        'label': label,
                        'confidence': conf,
                        'box': {'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2}
                    })
            
            
            walls_detected = any(d['label'] == 'Wall' for d in detections)
            rooms = []
            if walls_detected:
                wall_boxes = [{'box': [d['box']['x1'], d['box']['y1'], d['box']['x2'], d['box']['y2']], 
                             'conf': d['confidence']} 
                            for d in detections if d['label'] == 'Wall']
                
                _, rooms_info = helper.detect_rooms(img, wall_boxes)
                rooms = [{'id': r['id'], 'area': r['area'], 
                         'box': {'x1': r['box'][0], 'y1': r['box'][1], 
                                'x2': r['box'][2], 'y2': r['box'][3]}}
                        for r in rooms_info]
            
            
            object_counts = {}
            for d in detections:
                object_counts[d['label']] = object_counts.get(d['label'], 0) + 1
            
            
            response = {
                'detections': detections,
                'object_counts': object_counts,
                'rooms': rooms,
                'image_size': {'width': img.shape[1], 'height': img.shape[0]}
            }
            
            return jsonify(response)
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
        
        finally:
        
            if os.path.exists(filepath):
                os.remove(filepath)

@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

if __name__ == '__main__':
    load_model()
    app.run(debug=True, port=5000)
