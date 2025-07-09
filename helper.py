import PIL
import pandas as pd
import numpy as np
import cv2
from typing import List, Tuple, Dict
import math

def count_detected_objects(model, filtered_boxes):
    """
    Count detected objects and return a dictionary of counts.
    """
    object_counts = {}
    for box in filtered_boxes:
        
        label = model.names[int(box.cls)]
       
        object_counts[label] = object_counts.get(label, 0) + 1
    return object_counts

def generate_csv(object_counts):
    """
    Generate CSV data from detected object counts.
    """
    csv_data = pd.DataFrame(list(object_counts.items()), columns=['Label', 'Count'])
    csv_file = csv_data.to_csv(index=False)
    return csv_file

def detect_rooms(image: np.ndarray, walls: List[Dict]) -> Tuple[np.ndarray, List[Dict]]:
    """
    Detect rooms in a floor plan based on wall positions.
    
    Args:
        image: Input floor plan image
        walls: List of wall detections, each containing 'box' (x1,y1,x2,y2) and 'conf'
        
    Returns:
        Tuple containing:
        - Image with room detections drawn
        - List of detected rooms with their coordinates
    """
    
    img = image.copy()
    
    
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    
    _, thresh = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)
    
    
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    rooms = []
    room_counter = 1
    
    for contour in contours:
        
        area = cv2.contourArea(contour)
        if area < 1000:  
            continue
            
        
        x, y, w, h = cv2.boundingRect(contour)
        
       
        center_x = x + w // 2
        center_y = y + h // 2
        
        
        room = {
            'id': room_counter,
            'box': (x, y, x+w, y+h),  # x1, y1, x2, y2
            'center': (center_x, center_y),
            'area': area
        }
        rooms.append(room)
        
        
        cv2.rectangle(img, (x, y), (x+w, y+h), (0, 255, 0), 2)
        
        
        cv2.putText(img, f'Room {room_counter}', (x, y-10),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
        
        room_counter += 1
    
    return img, rooms
