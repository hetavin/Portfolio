from flask import Blueprint, render_template, request, jsonify
from Services.chat import chat_with_ai
from user_agents import parse as ua_parse
import requests as http_requests
import db

main = Blueprint("main", __name__)

@main.route("/")
def home():
    return render_template("index.html")


def _track_visitor():
    try:
        ua_string = request.user_agent.string if request.user_agent else ""
        ua = ua_parse(ua_string)
        if ua.is_mobile:
            device_type = "Mobile"
        elif ua.is_tablet:
            device_type = "Tablet"
        elif ua.is_pc:
            device_type = "Desktop"
        else:
            device_type = "Bot/Other"
        device_name = f"{device_type} · {ua.browser.family} on {ua.os.family}"

        model = ua.device.model or ""
        brand = ua.device.brand or ""
        owner_name = f"{brand} {model}".strip() or device_type

        location = ""
        try:
            ip = request.remote_addr
            if ip and ip not in ("127.0.0.1", "::1"):
                geo = http_requests.get(f"http://ip-api.com/json/{ip}?fields=city,regionName,country", timeout=3).json()
                if geo.get("city"):
                    location = f"{geo['city']}, {geo['regionName']}, {geo['country']}"
        except Exception:
            pass

        try:
            tz_offset = int(request.cookies.get("tz_offset", 0))
        except (ValueError, TypeError):
            tz_offset = 0

        db.add_visitor(
            ip=request.remote_addr,
            user_agent=ua_string,
            path=request.path,
            referrer=request.referrer or "",
            device_name=device_name,
            location=location,
            owner_name=owner_name,
            tz_offset=tz_offset,
        )
    except Exception as e:
        print("Visitor tracking error:", e)


@main.route("/api/visit", methods=["POST", "GET"])
def track_visit():
    """Logged by the browser after the tz_offset cookie is set, so the
    visitor's actual local open-time is captured accurately."""
    _track_visitor()
    return jsonify({"ok": True})


@main.route("/api/location", methods=["POST"])
def save_location():
    data = request.get_json(silent=True) or {}
    lat, lon = data.get("lat"), data.get("lon")
    if not lat or not lon:
        return jsonify({"ok": False}), 400
    try:
        res = http_requests.get(
            "https://nominatim.openstreetmap.org/reverse",
            params={"lat": lat, "lon": lon, "format": "json"},
            headers={"User-Agent": "PortfolioTracker/1.0"},
            timeout=4,
        ).json()
        addr = res.get("address", {})
        city    = addr.get("city") or addr.get("town") or addr.get("village") or ""
        state   = addr.get("state") or ""
        country = addr.get("country") or ""
        location = ", ".join(filter(None, [city, state, country]))
        if location:
            db.update_visitor_location(request.remote_addr, location)
    except Exception:
        pass
    return jsonify({"ok": True})


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