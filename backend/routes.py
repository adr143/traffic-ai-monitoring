from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, decode_token
from flask import Flask, Blueprint, request, jsonify, Response, url_for
from models import Vehicle, Violation, vehicle_violation, User
from multiprocessing import Process
from flask_socketio import SocketIO
from flask_mail import Message
from threading import Thread
from camera import Camera
import pytesseract
import threading
import base64
import os

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

class Routes:
    def __init__(self, app, db, bcrypt, mail, jwt):
        self.app = app
        self.db = db
        self.bcrypt = bcrypt
        self.mail = mail
        self.jwt = jwt
        self.main_bp = Blueprint('main', __name__)
        self.socketio = SocketIO(app, cors_allowed_origins="*")

        self.camera = Camera(0, "camera1", self.socketio, self.db, self.app)

        self.frames = {}
 
        self.socketio.on_event('connect', self.connect)
        self.socketio.on_event('disconnect', self.disconnect)

        self.main_bp.add_url_rule('/cameras', 'cameras', self.cameras, methods=['GET'])
        self.main_bp.add_url_rule('/vehicles', 'vehicles', self.get_vehicles, methods=['GET'])
        self.main_bp.add_url_rule('/auth/login', 'login', self.login, methods=['POST'])
        self.main_bp.add_url_rule('/auth/protected', 'protected', self.protected, methods=['GET'])
        self.main_bp.add_url_rule('/get_line', 'get_line', self.get_line, methods=['GET'])
        self.main_bp.add_url_rule('/update_line', 'update_line', self.update_line, methods=['POST'])
        self.main_bp.add_url_rule('/get_polygon', 'get_polygon', self.get_polygon, methods=['GET'])
        self.main_bp.add_url_rule('/update_polygon', 'update_polygon', self.update_polygon, methods=['POST'])
        self.main_bp.add_url_rule('/get_speed_limit', 'get_speed_limit', self.get_speed_limit, methods=['GET'])
        self.main_bp.add_url_rule('/update_speed_limit', 'update_speed_limit', self.update_speed_limit, methods=['POST'])
        self.main_bp.add_url_rule('/get_license_text/<int:vehicle_id>', 'get_license_text', self.get_license_text, methods=['GET'])
        self.main_bp.add_url_rule('/confirm/<token>', 'confirm_email', self.confirm_email, methods=['GET'])
        self.main_bp.add_url_rule('/auth/register', 'register', self.register, methods=['POST'])
        
        self.app.register_blueprint(self.main_bp)
        self.db.init_app(self.app)

        self.initialize_violations()

    def initialize_violations(self):
        with self.app.app_context():
            self.db.create_all()
            existing_violations = {v.name for v in Violation.query.all()}  # Get existing violations
            
            violations_to_add = [
                "No Helmet",
                "Overloading",
                "Overspeeding"
            ]

            for violation_name in violations_to_add:
                if violation_name not in existing_violations:
                    self.db.session.add(Violation(name=violation_name))
            
            self.db.session.commit()

    def register(self):
        data = request.json
        hashed_password = self.bcrypt.generate_password_hash(data["password"]).decode("utf-8")
        user = User(username=data["username"], email=data["email"], password=hashed_password)
        self.db.session.add(user)
        self.db.session.commit()

        # Send Confirmation Email
        print("Confirmation")
        token = create_access_token(identity=user.email, expires_delta=False)
        confirm_url = url_for("main.confirm_email", token=token, _external=True)
        msg = Message("Confirm Your Email", sender=self.app.config["MAIL_DEFAULT_SENDER"], recipients=[user.email])
        msg.body = f"Click the link to confirm your email: {confirm_url}"
        self.mail.send(msg)

        return jsonify({"message": "User registered. Please check your email to confirm your account."}), 201

    def confirm_email(self, token):
        user_email = decode_token(token)["sub"]
        user = User.query.filter_by(email=user_email).first()
        if not user:
            return jsonify({"message": "Invalid token"}), 400
        user.confirmed = True
        self.db.session.commit()
        return jsonify({"message": "Email confirmed successfully!"}), 200

    def login(self):
        data = request.json
        user = User.query.filter_by(username=data["username"]).first()
        if not user or not self.bcrypt.check_password_hash(user.password, data["password"]):
            return jsonify({"message": "Invalid credentials"}), 401
        if not user.confirmed:
            return jsonify({"message": "Email not confirmed"}), 401
        access_token = create_access_token(identity=user.username)
        return jsonify({"access_token": access_token}), 200

    def get_vehicles(self):
        vehicles = Vehicle.query.all()
        vehicles_data = []

        for v in vehicles:
            image_path = os.path.join(self.app.config['UPLOAD_FOLDER'], v.image_path)
            license_path = os.path.join(self.app.config['UPLOAD_FOLDER'], v.license_path)

            if os.path.exists(image_path):
                with open(image_path, "rb") as img_file:
                    base64_string = base64.b64encode(img_file.read()).decode("utf-8")
            else:
                base64_string = None  # If no image exists

            if os.path.exists(license_path):
                with open(license_path, "rb") as img_file:
                    license_base64_string = base64.b64encode(img_file.read()).decode("utf-8")
            else:
                license_base64_string = None  # If no image exists

            violations = [violation.name for violation in v.violations] if v.violations else []

            stmt = self.db.session.query(Violation.name, vehicle_violation.c.timestamp) \
                    .join(vehicle_violation, Violation.id == vehicle_violation.c.violation_id) \
                    .filter(vehicle_violation.c.vehicle_id == v.id)

            timestamp = stmt.all()[0].timestamp.strftime("%Y-%m-%d %H:%M:%S")

            speed = v.speed

            vehicles_data.append({
                'id': v.id,
                'image_base64': base64_string,
                'license_base64': license_base64_string,
                'timestamp': timestamp,
                'violations': violations,
                'speed': speed,
            })

        return jsonify(vehicles_data)

    def get_license_text(self, vehicle_id):
        print("OK, license text")
        vehicle = Vehicle.query.get(vehicle_id)
        
        if not vehicle:
            return jsonify({"error": "Vehicle not found"}), 404

        license_path = os.path.join(self.app.config['UPLOAD_FOLDER'], vehicle.license_path) if vehicle.license_path else None

        license_text = pytesseract.image_to_string(license_path)

        if not license_text:
            license_text = "XXXX-XXXX"

        return jsonify({"license_text": license_text})


    def start_run(self, host='0.0.0.0', port=5000):
        self.socketio.run(self.app, host=host, port=port)

    def cameras(self):
        with self.app.app_context():
            return jsonify([camera.name])

    def get_speed_limit(self):
        return jsonify({'speed_limit': self.camera.get_speed_limit()})

    def get_line(self):
        line_coords = self.camera.get_line()
        return jsonify(line_coords)

    def get_polygon(self):
        polygon_coords = self.camera.get_polygon()
        return jsonify(polygon_coords)

    def update_speed_limit(self):
        data = request.json
        print("Ok, updating speed limit")
        print(data)
        if "speed_limit" in data:
            speed_limit = data["speed_limit"]
            self.camera.set_speed_limit(speed_limit)
            return jsonify({"message": "Speed limit updated", "speed_limit": speed_limit}), 200
        return jsonify({"error": "Invalid data format"}), 400

    def update_polygon(self):
        data = request.json
        print("Ok, updating polygon")
        if all(key in data for key in ["x1", "y1", "x2", "y2", "x3", "y3", "x4", "y4"]):
            polygon_coords = self.camera.set_polygon(data['x1'], data['y1'], data['x2'], data['y2'], data['x3'], data['y3'], data['x4'], data['y4'])
            return jsonify({"message": "Polygon coordinates updated", "polygon_coords": polygon_coords}), 200
        return jsonify({"error": "Invalid data format"}), 400

    def update_line(self):
        data = request.json
        print("Ok, updating line")
        if all(key in data for key in ["x1", "y1", "x2", "y2"]):
            line_coords = self.camera.set_line(data['x1'], data['y1'], data['x2'], data['y2'])
            return jsonify({"message": "Line coordinates updated", "line_coords": line_coords}), 200
        return jsonify({"error": "Invalid data format"}), 400

    @jwt_required()
    def protected(self):
        user = get_jwt_identity()
        return jsonify({"message": f"Welcome, {user}!"}), 200

    def connect(self):
        print("Client connected")
        self.streaming_active = True
        self.socketio.start_background_task(self.camera.capture_frame)

    def disconnect(self):
        print("Client disconnected")
        self.streaming_active = False
        print("No clients connected, stopping streaming")

