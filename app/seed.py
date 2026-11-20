from app import create_app, bcrypt
from app.models import db, User, Car

app = create_app()

def run_seed():
    with app.app_context():
        print("Provisioning tables...")
        db.create_all()

        if not User.query.filter_by(email="admin@valamcars.com").first():
            admin = User(
                full_name="Valam Operations Admin",
                email="admin@valamcars.com",
                phone="+91 98400 11223",
                password_hash=bcrypt.generate_password_hash("Admin@1234").decode('utf-8'),
                role="admin"
            )
            customer = User(
                full_name="Suresh Kumar",
                email="customer@gmail.com",
                phone="+91 97890 98765",
                password_hash=bcrypt.generate_password_hash("User@1234").decode('utf-8'),
                role="user"
            )
            db.session.add_all([admin, customer])

        if Car.query.count() == 0:
            fleet = [
                Car(
                    name="Toyota Avanza",
                    brand="Toyota",
                    watermark_text="AVANZA",
                    category="MPV",
                    transmission="Automatic",
                    fuel_type="Petrol",
                    seating_capacity=7,
                    has_ac=True, 
                    price_per_hour=145.0,
                    price_per_day=3480.0,
                    rating=4.8,
                    location="Coimbatore International Airport",
                    image_url="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=900&q=80",
                    description="The ultimate family touring MPV featuring dual air conditioning, generous luggage volume, and smooth continuous variable transmission."
                ),
                Car(
                    name="Maruti Swift",
                    brand="Maruti Suzuki",
                    watermark_text="SWIFT",
                    category="Hatchback",
                    transmission="Automatic",
                    fuel_type="Petrol",
                    seating_capacity=5,
                    has_ac=True,
                    price_per_hour=131.0,
                    price_per_day=3144.0,
                    rating=4.5,
                    location="RS Puram, Coimbatore.",
                    image_url="https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=900&q=80",
                    description="Agile, comfortable city cruiser delivering high fuel economy and responsive parking in Coimbatore's bustling centers."
                ),
                Car(
                    name="Mahindra Scorpio",
                    brand="Mahindra",
                    watermark_text="SCORPIO",
                    category="SUV",
                    transmission="Automatic",
                    fuel_type="Diesel",
                    seating_capacity=7,
                    has_ac=True,
                    price_per_hour=160.0,
                    price_per_day=3840.0,
                    rating=4.7,
                    location="RS Puram, Coimbatore.",
                    image_url="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=900&q=80",
                    description="Dominant SUV with 2.2L mHawk diesel power, high ground clearance, and robust multi-link rear suspension for hill stations."
                ),
                Car(
                    name="Kia Sonet",
                    brand="Kia",
                    watermark_text="SONET",
                    category="Compact SUV",
                    transmission="Automatic",
                    fuel_type="Petrol",
                    seating_capacity=5,
                    has_ac=True,
                    price_per_hour=131.0,
                    price_per_day=3144.0,
                    rating=4.5,
                    location="RS Puram, Coimbatore.",
                    image_url="https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=900&q=80",
                    description="Premium compact SUV featuring connected touchscreen navigation, ventilated seats, and sporty handling."
                ),
                Car(
                    name="Mahindra XUV700",
                    brand="Mahindra",
                    watermark_text="XUV700",
                    category="Luxury SUV",
                    transmission="Automatic",
                    fuel_type="Diesel",
                    seating_capacity=7,
                    has_ac=True,
                    price_per_hour=190.0,
                    price_per_day=4560.0,
                    rating=4.9,
                    location="Gandhipuram Hub, Coimbatore.",
                    image_url="https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?auto=format&fit=crop&w=900&q=80",
                    description="Luxury flagship with panoramic skyroof, ADAS safety suite, and whisper-quiet highway ride."
                )
            ]
            db.session.add_all(fleet)

        db.session.commit()
        print("Database seeded with Figma fleet items.")

if __name__ == '__main__':
    run_seed()