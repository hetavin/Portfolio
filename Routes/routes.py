from flask import Blueprint, render_template, request, jsonify
from Services.chat import chat_with_ai
import db

main = Blueprint("main", __name__)

@main.route("/")
def home():
    try:
        db.add_visitor(
            ip=request.remote_addr,
            user_agent=request.user_agent.string if request.user_agent else "",
            path=request.path,
            referrer=request.referrer or "",
        )
    except Exception as e:
        print("Visitor tracking error:", e)

    return render_template("index.html")


@main.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}

    user_message = data.get("message")
    if not user_message:
        return jsonify({"error": "Message is required."}), 400

    try:
        response = chat_with_ai(user_message)
    except Exception as e:
        print("Chat error:", e)
        return jsonify({"error": "Failed to get a response.", "detail": str(e)}), 502

    return jsonify({
        "response": response
    })