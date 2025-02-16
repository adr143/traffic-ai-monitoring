from models import Vehicle, Violation
from datetime import datetime
from ultralytics import YOLO
from ultralytics.solutions import SpeedEstimator
import supervision as sv
import numpy as np
import threading
import base64
import time
import torch
import cv2
import os

class Camera:
    def __init__(self, id, name, socketio, db, app):
        self.id = id
        self.name = name
        self.cap = cv2.VideoCapture(id)
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)  # ✅ Reduce buffer size
        self.cap.set(cv2.CAP_PROP_FPS, 30)  # ✅ Limit FPS if needed
        self.main_model = YOLO("models/motorist/motocorist.pt")
        self.main_model.to("cuda")
        self.sub_model_1 = YOLO("models/license/licenciados_4.pt")
        self.sub_model_1.to("cuda")
        self.sub_model_2 = YOLO("models/violations/violaciones.pt")
        self.sub_model_2.to("cuda")
        self.app = app
        self.socketio = socketio
        self.db = db
        self.frame_width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.frame_height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        self.is_open = False

        self.speed_limit = 30

        self.speed_data = None

        self.polygon_coords = {
            'x1': 0, 'y1': 0,
            'x2': 0, 'y2': self.frame_height,
            'x3': self.frame_width, 'y3': self.frame_height,
            'x4': self.frame_width, 'y4': 0
        }

        self.speed_region = [
            (self.polygon_coords['x1'], self.polygon_coords['y1']),
            (self.polygon_coords['x2'], self.polygon_coords['y2']),
            (self.polygon_coords['x3'], self.polygon_coords['y3']),
            (self.polygon_coords['x4'], self.polygon_coords['y4'])
        ]


        self.speed_estimator = SpeedEstimator(
                                show=True,  # Display the output
                                model="models/motorist/motocorist.pt",  # Path to the YOLO11 model file.
                                region=self.speed_region,  # Pass region points
                            )

        self.counters = 0

        self.tracker = sv.ByteTrack()

        self.mid_x = self.frame_width // 2

        self.start_point = (self.mid_x, 0)
        self.end_point = (self.mid_x, self.frame_height)

        self.start, self.end = sv.Point(x=self.mid_x, y=0), sv.Point(x=self.mid_x, y=self.frame_height)
        self.line_zone = sv.LineZone(start=self.start, end=self.end)

        self.line_annotation = sv.LineZoneAnnotator()

        self.lock = threading.Lock()

        names = self.sub_model_2.names
        print("Available sub-models:")
        print(names)

    def on_crossed(self, object_id, position):
        print(f"Object {object_id} crossed the line at {position}!")

    def get_line(self):
        with self.lock:
            print("Getting line")
            return {'x1': self.start_point[0], 'y1': self.start_point[1], 'x2': self.end_point[0], 'y2': self.end_point[1]}

    def set_line(self, start_x, start_y, end_x, end_y):
        with self.lock:
            self.start_point = (start_x, start_y)
            self.end_point = (end_x, end_y)
            self.start, self.end = sv.Point(x=start_x, y=start_y), sv.Point(x=end_x, y=end_y)
            self.line_zone = sv.LineZone(start=self.start, end=self.end)
            return {'x1': self.start_point[0], 'y1': self.start_point[1], 'x2': self.end_point[0], 'y2': self.end_point[1]}

    def get_polygon(self):
        with self.lock:
            print("Getting line")
            return self.polygon_coords

    def set_polygon(self, x1, y1, x2, y2, x3, y3, x4, y4):
        with self.lock:
            self.polygon_coords = {
                'x1': x1, 'y1': y1,
                'x2': x2, 'y2': y2,
                'x3': x4, 'y3': y4,
                'x4': x4, 'y4': y4
            }
            self.speed_region = [
                (x1, y1),
                (x2, y2),
                (x3, y3),
                (x4, y4)
            ]

            self.speed_estimator = SpeedEstimator(
                                show=True,
                                model="models/motorist/motocorist.pt",
                                region=self.speed_region,
                            )

            return self.polygon_coords

    def set_speed_limit(self, speed_limit):
        with self.lock:
            self.speed_limit = speed_limit

    def get_speed_limit(self):
        return self.speed_limit

    def save_to_db(self, motorist_img, license_img, violations, speed):
        if len(violations) <= 0:
            return
        with self.lock:
            motorist_filename = f"Motorist_{datetime.now().strftime('%Y%m%d%H%M%S')}.jpg"
            motorist_filepath = os.path.join(self.app.config['UPLOAD_FOLDER'], "img", "motorist", motorist_filename)
            cv2.imwrite(motorist_filepath, motorist_img)

            license_filepath = os.path.join(self.app.config['UPLOAD_FOLDER'], "img", "license", "Capture.png")
            if license_img is not None:
                license_filename = f"License_{datetime.now().strftime('%Y%m%d%H%M%S')}.jpg"
                license_filepath = os.path.join(self.app.config['UPLOAD_FOLDER'], "img", "license", license_filename)
                cv2.imwrite(license_filepath, license_img)

            with self.app.app_context():
                vehicle = Vehicle(image_path=motorist_filepath, license_path=license_filepath, speed=speed)
                self.db.session.add(vehicle)
                self.db.session.commit()
            
                for violation_name in violations:
                    violation = Violation.query.filter_by(name=violation_name).first()
                    if violation:
                        vehicle.violations.append(violation)
                        self.db.session.commit()

    def find_nearest_key(self, data_dict, target_array):
        """
        Finds the key whose tensor values are closest to the given target array.

        :param data_dict: Dictionary where values are lists containing tensors.
        :param target_array: NumPy array or list to compare against.
        :return: The key with the closest tensor values.
        """
        target_tensor = torch.tensor(target_array)  # Convert target to a tensor
        closest_key = None
        min_distance = float("inf")

        for key, tensor_list in data_dict.items():
            for tensor in tensor_list:  # Handle lists of tensors
                tensor = tensor.squeeze()  # Remove extra dimensions if any
                distance = torch.norm(tensor - target_tensor)  # Euclidean distance

                if distance < min_distance:
                    min_distance = distance
                    closest_key = key

        return closest_key

    def enforce_dict_size_limit(self, data_dict, max_size=20):
        """
        Ensures the dictionary does not exceed max_size by removing the oldest entry.
        
        :param data_dict: Dictionary to manage.
        :param max_size: Maximum allowed size of the dictionary.
        """
        while len(data_dict) > max_size:
            first_key = next(iter(data_dict))  # Get the first (oldest) key
            data_dict.pop(first_key)  # Remove it
        return data_dict

    def filter_dict_by_keys(self, a, b):
        """
        Removes any key in dictionary `b` that does not exist in dictionary `a`.

        :param a: Reference dictionary.
        :param b: Dictionary to filter.
        :return: New dictionary with only matching keys.
        """
        return {key: value for key, value in b.items() if key in a}


    def process_detections(self, tracked_detections, frame):
        crossed_in, crossed_out = self.line_zone.trigger(tracked_detections)
        track_m = {}
        for box, track_id in zip(self.speed_estimator.boxes, self.speed_estimator.track_ids):
            if track_id in track_m:
                track_m[track_id].append(box)
            else:
                track_m[track_id] = [box]
        track_m = self.enforce_dict_size_limit(track_m)
        print(track_m)
        print(self.speed_estimator.spd)
        self.speed_estimator.trk_pp = self.filter_dict_by_keys(track_m, self.speed_estimator.trk_pp)
        self.speed_estimator.trk_pt = self.filter_dict_by_keys(track_m, self.speed_estimator.trk_pt)
        self.speed_estimator.spd = self.filter_dict_by_keys(track_m, self.speed_estimator.spd)

        if crossed_out.any():
            motorist_bounds = tracked_detections[crossed_out]
            for bound in motorist_bounds:
                coords = bound[0]
                x1, y1, x2, y2 =  int(coords[0]), int(coords[1]), int(coords[2]), int(coords[3])
                track_id = self.find_nearest_key(track_m, (coords[0], coords[1], coords[2], coords[3]))
                cv2.putText(frame, f"motorist: {self.speed_estimator.tracks[0]}", (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                crop_image = frame[y1:y2, x1:x2]
                v_speed = self.speed_estimator.spd[track_id]
                violations = self.sub_model_2(crop_image, conf=0.5)
                licencias = self.sub_model_1(crop_image, conf=0.5)[0]
                license_img = licencias.boxes.xyxy.tolist()
                if not license_img:
                    license_img = None
                else:
                    x1, y1, x2, y2 = license_img[0]
                    license_img = crop_image[int(y1):int(y2), int(x1):int(x2)]
                names = self.sub_model_2.names
                top_classes = []
                for r in violations:
                    for c in r.boxes.cls:
                        top_classes.append(names[int(c)])
                print("top classes", top_classes)
                if v_speed > self.speed_limit:
                    top_classes.append("Overspeeding")
                if len(top_classes) > 0 and ('No_Helmet' in top_classes or 'Overloading' in top_classes or "Overspeeding" in top_classes):
                    self.save_to_db(crop_image, license_img, [viola.replace('_', ' ') for viola in top_classes], round(v_speed.item(), 1))

        if crossed_in.any():
            motorist_bounds = tracked_detections[crossed_in]
            for bound in motorist_bounds:
                print("bound", bound)
                coords = bound[0]
                x1, y1, x2, y2 =  int(coords[0]), int(coords[1]), int(coords[2]), int(coords[3])
                track_id = self.find_nearest_key(track_m, (coords[0], coords[1], coords[2], coords[3]))
                cv2.putText(frame, f"motorist: {self.speed_estimator.tracks[0]}", (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                crop_image = frame[y1:y2, x1:x2]
                v_speed = self.speed_estimator.spd[track_id]
                violations = self.sub_model_2(crop_image, conf=0.5)
                licencias = self.sub_model_1(crop_image, conf=0.5)[0]
                license_img = licencias.boxes.xyxy.tolist()
                if not license_img:
                    license_img = None
                else:
                    x1, y1, x2, y2 = license_img[0]
                    license_img = crop_image[int(y1):int(y2), int(x1):int(x2)]
                names = self.sub_model_2.names
                top_classes = []
                for r in violations:
                    for c in r.boxes.cls:
                        top_classes.append(names[int(c)])
                print("top classes", top_classes)
                if v_speed > self.speed_limit:
                    top_classes.append("Overspeeding")
                if len(top_classes) > 0 and ('No_Helmet' in top_classes or 'Overloading' in top_classes or "Overspeeding" in top_classes):
                    self.save_to_db(crop_image, license_img, [viola.replace('_', ' ') for viola in top_classes], round(v_speed.item(), 1))

    def capture_frame(self):
        self.is_open = True
        while True:
            ret, frame = self.cap.read()  # Read frame
            if not ret:
                with self.lock:
                    self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    continue

            frame = cv2.GaussianBlur(frame, (3,3), sigmaX=1, sigmaY=1)

            results = None

            try:
                self.speed_estimator.estimate_speed(frame)
                results = self.speed_estimator.tracks[0]
                self.speed_data = self.speed_estimator.spd
            except:
                results = self.main_model.predict(frame)[0]

            # TODO: combine speed estimator track data to Detections class

            # results = self.main_model.predict(frame)[0]
            # print("Supervision:")
            # print(results)

            # cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            # cv2.putText(frame, f"motorist: {self.speed_estimator.spd}", (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2

            detections = sv.Detections.from_ultralytics(results)
            tracked_detections = self.tracker.update_with_detections(detections)

            annotated_frame = self.line_annotation.annotate(
                frame=frame.copy(),
                line_counter=self.line_zone
            )

            threading.Thread(target=self.process_detections, args=(tracked_detections, annotated_frame), daemon=True).start()

            _, buffer = cv2.imencode('.jpg', annotated_frame)
            img_bytes = base64.b64encode(buffer).decode('utf-8')
            self.socketio.emit('frame', img_bytes)


    def release(self):
        if self.is_open:
            self.cap.release()
            self.is_open = False
    
    def __del__(self):
        self.release()