import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_URL = os.getenv("GROQ_API_URL")
GROQ_MODEL = os.getenv("GROQ_MODEL")

DB_HOST = os.getenv("DB_HOST")
DB_PORT = int(os.getenv("DB_PORT", 3306))
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_DATABASE = os.getenv("DB_DATABASE")

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")

SECRET_KEY = os.getenv("SECRET_KEY", "change-this-secret-key")

MAIL_SENDER = os.getenv("MAIL_SENDER")
MAIL_APP_PASSWORD = os.getenv("MAIL_APP_PASSWORD")
MAIL_RECEIVER = os.getenv("MAIL_RECEIVER")
