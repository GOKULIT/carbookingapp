import os
import uuid
from werkzeug.utils import secure_filename
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, User, Car, Booking

admin_bp = Blueprint('admin', __name__)

def check_admin(user_id):
    user = User.query.get(user_id)
    return user is not None and user.role == 'admin'

@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    if not check_admin(get_jwt_identity()):
        return jsonify({"error": "Unauthorized"}), 403

    confirmed = Booking.query.filter_by(payment_status='SUCCESS').all()
    total_rev = sum(b.total_amount for b in confirmed)

    return jsonify({
        "total_revenue": total_rev,
        "total_bookings": len(confirmed),
        "total_cars": Car.query.count(),
        "total_users": User.query.filter_by(role='user').count()
    }), 200

@admin_bp.route('/cars', methods=['POST'])
@jwt_required()
def add_new_car():
    if not check_admin(get_jwt_identity()):
        return jsonify({"error": "Unauthorized"}), 403

    name = request.form.get('name')
    brand = request.form.get('brand')
    category = request.form.get('category', 'SUV')
    watermark = request.form.get('watermark_text', name.split()[0].upper() if name else '')
    transmission = request.form.get('transmission', 'Automatic')
    fuel = request.form.get('fuel_type', 'Petrol')
    seats = int(request.form.get('seating_capacity', 5))
    price_hr = float(request.form.get('price_per_hour', 131))
    price_day = float(request.form.get('price_per_day', price_hr * 24))
    location = request.form.get('location', 'RS Puram, Coimbatore.')
    description = request.form.get('description', '')

    file = request.files.get('image')
    img_url = request.form.get('image_url')

    if file and file.filename != '':
        fname = secure_filename(file.filename)
        unique_name = f"{uuid.uuid4().hex}_{fname}"
        file.save(os.path.join(current_app.config['UPLOAD_FOLDER'], unique_name))
        final_image = f"/static/uploads/{unique_name}"
    elif img_url:
        final_image = img_url
    else:
        return jsonify({"error": "Car image file or URL is required."}), 400

    car = Car(
        name=name, brand=brand, category=category, watermark_text=watermark,
        transmission=transmission, fuel_type=fuel, seating_capacity=seats,
        price_per_hour=price_hr, price_per_day=price_day, location=location,
        image_url=final_image, description=description
    )
    db.session.add(car)
    db.session.commit()
    return jsonify({"message": "Car added to fleet successfully", "car": car.to_dict()}), 201

@admin_bp.route('/bookings', methods=['GET'])
@jwt_required()
def list_all_bookings():
    if not check_admin(get_jwt_identity()):
        return jsonify({"error": "Unauthorized"}), 403
    bookings = Booking.query.order_by(Booking.id.desc()).all()
    return jsonify([b.to_dict() for b in bookings]), 200