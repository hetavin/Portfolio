import os

from flask import Flask
from Routes.routes import main
from Routes.admin import admin

import db
from config import SECRET_KEY

app = Flask(__name__)
app.secret_key = SECRET_KEY
app.config["UPLOAD_FOLDER"] = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "uploads"
)
app.config["MAX_CONTENT_LENGTH"] = 20 * 1024 * 1024

app.register_blueprint(main)
app.register_blueprint(admin)

with app.app_context():
    try:
        db.init_db()
        print("Database tables ready.")
    except Exception as e:
        print("Database init failed:", e)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
