from flask import Blueprint, request, jsonify
from app.models import Car

car_bp = Blueprint('cars', __name__)

@car_bp.route('', methods=['GET'])
def get_cars():
    category = request.args.get('category')
    brand = request.args.get('brand')
    query = Car.query.filter_by(is_active=True)

    if category and category.lower() != 'all':
        query = query.filter(Car.category.ilike(category))
    if brand and brand.lower() != 'all':
        query = query.filter(Car.brand.ilike(brand))

    cars = query.order_by(Car.id.asc()).all()
    return jsonify([c.to_dict() for c in cars]), 200

@car_bp.route('/<int:car_id>', methods=['GET'])
def get_car_by_id(car_id):
    car = Car.query.get_or_404(car_id)
    return jsonify(car.to_dict()), 200