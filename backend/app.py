from flask import Flask, render_template
from ultralytics import YOLO
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from routes import Routes
from models import db
import base64
import time
import cv2
import os

app = Flask(__name__)

# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///track_record.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# JWT Configuration
app.config["JWT_SECRET_KEY"] = "your-secret-key"

# Upload Folder
app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(),'static')


# Email Configuration
app.config["MAIL_SERVER"] = "smtp.gmail.com"
app.config["MAIL_PORT"] = 587
app.config["MAIL_USE_TLS"] = True
app.config["MAIL_USERNAME"] = ""
app.config["MAIL_PASSWORD"] = "your_password"

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
jwt = JWTManager(app)
CORS(app, resources={r"*": {"origins": "*"}})
routes = Routes(app, db)

if __name__ == '__main__':
    routes.start_run()
