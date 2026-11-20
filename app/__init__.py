import os
import razorpay
from flask import Flask, render_template
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from app.config import Config
from app.models import db, Car

bcrypt = Bcrypt()
jwt = JWTManager()
razorpay_client = None

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    CORS(app)

    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    global razorpay_client
    razorpay_client = razorpay.Client(
        auth=(app.config['RAZORPAY_KEY_ID'], app.config['RAZORPAY_KEY_SECRET'])
    )

    # API Blueprints
    from app.routes.auth_routes import auth_bp
    from app.routes.car_routes import car_bp
    from app.routes.booking_routes import booking_bp
    from app.routes.admin_routes import admin_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(car_bp, url_prefix='/api/cars')
    app.register_blueprint(booking_bp, url_prefix='/api/bookings')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')

    # Frontend Navigation View Routes
    @app.route('/')
    def index():
        cars = Car.query.filter_by(is_active=True).all()
        return render_template('index.html', cars=cars)

    @app.route('/fleet')
    def fleet():
        cars = Car.query.filter_by(is_active=True).all()
        return render_template('cars.html', cars=cars)

    @app.route('/car/<int:car_id>')
    def car_details(car_id):
        car = Car.query.get_or_404(car_id)
        return render_template('car_detail.html', car=car, rzp_key=app.config['RAZORPAY_KEY_ID'])

    @app.route('/my-bookings')
    def my_bookings():
        return render_template('my_bookings.html')

    # Secret Admin View - Not accessible in public nav links
    @app.route('/admin')
    def admin_portal():
        return render_template('admin.html')

    return app