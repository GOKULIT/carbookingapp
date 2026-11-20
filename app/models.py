from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import and_

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(25), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='user')  # 'admin' or 'user'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    bookings = db.relationship('Booking', backref='customer', lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "full_name": self.full_name,
            "email": self.email,
            "phone": self.phone,
            "role": self.role
        }

class Car(db.Model):
    __tablename__ = 'cars'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    brand = db.Column(db.String(80), nullable=False)
    watermark_text = db.Column(db.String(50), nullable=True)  # e.g., 'SWIFT', 'SCORPIO', 'SONET'
    category = db.Column(db.String(50), nullable=False)       # Hatchback, SUV, Sedan, MPV
    transmission = db.Column(db.String(30), default='Automatic')
    fuel_type = db.Column(db.String(30), default='Petrol')
    seating_capacity = db.Column(db.Integer, default=5)
    has_ac = db.Column(db.Boolean, default=True)
    price_per_hour = db.Column(db.Float, nullable=False)
    price_per_day = db.Column(db.Float, nullable=False)
    rating = db.Column(db.Float, default=4.5)
    location = db.Column(db.String(150), default="RS Puram, Coimbatore.")
    image_url = db.Column(db.String(500), nullable=False)
    description = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    bookings = db.relationship('Booking', backref='car', lazy=True)

    def is_currently_booked(self):
        """Check if vehicle is booked right now."""
        now = datetime.utcnow()
        active = Booking.query.filter(
            Booking.car_id == self.id,
            Booking.payment_status == 'SUCCESS',
            Booking.booking_status == 'CONFIRMED',
            Booking.pickup_datetime <= now,
            Booking.dropoff_datetime >= now
        ).first()
        return active is not None

    def get_next_available_date(self):
        """Return the next available date string if currently booked."""
        now = datetime.utcnow()
        latest = Booking.query.filter(
            Booking.car_id == self.id,
            Booking.payment_status == 'SUCCESS',
            Booking.booking_status == 'CONFIRMED',
            Booking.dropoff_datetime >= now
        ).order_by(Booking.dropoff_datetime.desc()).first()
        
        if latest:
            return latest.dropoff_datetime.strftime('%d %b %Y')
        return "Now"

    def to_dict(self):
        currently_booked = self.is_currently_booked()
        return {
            "id": self.id,
            "name": self.name,
            "brand": self.brand,
            "watermark_text": self.watermark_text or self.name.split()[0].upper(),
            "category": self.category,
            "transmission": self.transmission,
            "fuel_type": self.fuel_type,
            "seating_capacity": self.seating_capacity,
            "has_ac": self.has_ac,
            "price_per_hour": self.price_per_hour,
            "price_per_day": self.price_per_day,
            "rating": self.rating,
            "location": self.location,
            "image_url": self.image_url,
            "description": self.description,
            "is_sold_out": currently_booked,
            "available_label": f"Available from {self.get_next_available_date()}" if currently_booked else "Available Now"
        }

class Booking(db.Model):
    __tablename__ = 'bookings'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    car_id = db.Column(db.Integer, db.ForeignKey('cars.id'), nullable=False)
    
    city = db.Column(db.String(100), default="Coimbatore, Tamilnadu")
    pickup_location = db.Column(db.String(255), nullable=False)
    dropoff_location = db.Column(db.String(255), nullable=False)
    pickup_datetime = db.Column(db.DateTime, nullable=False, index=True)
    dropoff_datetime = db.Column(db.DateTime, nullable=False, index=True)
    
    total_hours = db.Column(db.Integer, nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    
    # Razorpay Transaction Signature Fields
    razorpay_order_id = db.Column(db.String(100), unique=True, nullable=True)
    razorpay_payment_id = db.Column(db.String(100), unique=True, nullable=True)
    payment_status = db.Column(db.String(30), default='PENDING')   # PENDING, SUCCESS, FAILED
    booking_status = db.Column(db.String(30), default='CONFIRMED') # CONFIRMED, CANCELLED
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "car_id": self.car_id,
            "car": self.car.to_dict() if self.car else None,
            "user": self.customer.to_dict() if self.customer else None,
            "pickup_location": self.pickup_location,
            "dropoff_location": self.dropoff_location,
            "pickup_datetime": self.pickup_datetime.strftime('%d %b %Y, %I:%M %p'),
            "dropoff_datetime": self.dropoff_datetime.strftime('%d %b %Y, %I:%M %p'),
            "total_hours": self.total_hours,
            "total_amount": self.total_amount,
            "razorpay_order_id": self.razorpay_order_id,
            "razorpay_payment_id": self.razorpay_payment_id,
            "payment_status": self.payment_status,
            "booking_status": self.booking_status,
            "created_at": self.created_at.strftime('%d %b %Y, %I:%M %p')
        }