from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Subscriber(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    confirmed = db.Column(db.Boolean, default=False)

# Association table
vehicle_violation = db.Table('vehicle_record',
    db.Column('vehicle_id', db.Integer, db.ForeignKey('vehicle.id'), primary_key=True),
    db.Column('violation_id', db.Integer, db.ForeignKey('violation.id'), primary_key=True),
    db.Column('timestamp', db.DateTime, nullable=False, default=datetime.utcnow)
)

# Vehicle model with an image
class Vehicle(db.Model):
    __tablename__ = 'vehicle'
    id = db.Column(db.Integer, primary_key=True)
    image_path = db.Column(db.String(255), nullable=True)
    license_path = db.Column(db.String(255), nullable=True)
    violations = db.relationship('Violation', secondary=vehicle_violation, backref=db.backref('vehicles', lazy='dynamic'))
    speed = db.Column(db.Integer, nullable=True, default=0)

    def to_dict(self):
        return {
            'id': self.id,
            'image_path': self.image_path,
            'license_path': self.license_path,
            'violations': [v.name for v in self.violations],
            'speed': self.speed
        }

    def __repr__(self):
        return f'<Vehicle {self.name}>'

# Violation model
class Violation(db.Model):
    __tablename__ = 'violation'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)

    def __repr__(self):
        return f'<Violation {self.name}>'