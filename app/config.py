import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "valam-production-crypto-key-2026")
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", 
        "mysql+pymysql://root:@localhost:3306/valam_cars_db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "valam-jwt-signing-secret-token")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)
    
    # Razorpay Credentials
    RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_Rc8pEFWbfBWC56")
    RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "CphwvNylVXOSBjyFVURyOqWE")
    
    # RAZORPAY_KEY_ID = "rzp_test_Rc8pEFWbfBWC56"
    # RAZORPAY_KEY_SECRET = "CphwvNylVXOSBjyFVURyOqWE"
    
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "static", "uploads")
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024