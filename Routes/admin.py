import os
import hmac

from flask import (
    Blueprint, render_template, request, redirect, url_for,
    session, flash, send_from_directory, current_app, jsonify,
)
from werkzeug.utils import secure_filename

import db
from config import ADMIN_USERNAME, ADMIN_PASSWORD, SECRET_KEY
from Services.pdf_extractor import extract_chunks

admin = Blueprint("admin", __name__, template_folder="../templates")

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
ALLOWED_EXT = {".pdf"}
MAX_MB = 20


def _allowed(filename):
    return os.path.splitext(filename)[1].lower() in ALLOWED_EXT


def _check_password(password):
    if ADMIN_PASSWORD.startswith(("pbkdf2:", "scrypt:", "bcrypt:")):
        from werkzeug.security import check_password_hash
        return check_password_hash(ADMIN_PASSWORD, password)
    return hmac.compare_digest(ADMIN_PASSWORD, password)


def admin_required(view):
    def wrapper(*args, **kwargs):
        if not session.get("admin"):
            return redirect(url_for("admin.login"))
        return view(*args, **kwargs)
    wrapper.__name__ = view.__name__
    return wrapper


@admin.route("/admin/login", methods=["GET", "POST"])
def login():
    if session.get("admin"):
        return redirect(url_for("admin.dashboard"))

    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        if username == ADMIN_USERNAME and _check_password(password):
            session["admin"] = True
            session.permanent = True
            return redirect(url_for("admin.dashboard"))
        flash("Invalid username or password.", "error")

    return render_template("admin/login.html")


@admin.route("/admin")
@admin_required
def dashboard():
    stats = db.visitor_stats()
    visitors = db.list_visitors(200)
    pdfs = db.list_pdfs()
    return render_template(
        "admin/dashboard.html",
        stats=stats,
        visitors=visitors,
        pdfs=pdfs,
    )


@admin.route("/admin/upload", methods=["POST"])
@admin_required
def upload():
    title = request.form.get("title", "").strip()
    file = request.files.get("pdf")
    is_ajax = request.headers.get("X-Requested-With") == "XMLHttpRequest"

    def _err(msg):
        if is_ajax:
            return jsonify({"error": msg}), 400
        flash(msg, "error")
        return redirect(url_for("admin.dashboard"))

    if not file or not file.filename:
        return _err("No file selected.")
    if not _allowed(file.filename):
        return _err("Only PDF files are allowed.")
    if not title:
        title = os.path.splitext(file.filename)[0]

    filename = secure_filename(file.filename)
    if not filename:
        filename = "document.pdf"
    base, ext = os.path.splitext(filename)
    unique_name = f"{base}_{int(__import__('time').time())}{ext}"
    save_path = os.path.join(UPLOAD_FOLDER, unique_name)
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    file.save(save_path)

    db.add_pdf(title, unique_name, file.filename, os.path.getsize(save_path))

    try:
        pdf_record = db.get_pdf_by_filename(unique_name)
        if pdf_record:
            chunks = extract_chunks(save_path)
            db.save_chunks(pdf_record["id"], chunks)
    except Exception as e:
        print("PDF extraction error:", e)

    if is_ajax:
        pdf_record = pdf_record or db.get_pdf_by_filename(unique_name)
        size = os.path.getsize(save_path)
        return jsonify({
            "id":          pdf_record["id"],
            "title":       title,
            "size":        size,
            "size_label":  f"{size/1048576:.2f} MB" if size >= 1048576 else f"{size/1024:.1f} KB",
            "uploaded_at": pdf_record["uploaded_at"].strftime("%d %b %Y"),
        })

    flash("PDF uploaded successfully.", "success")
    return redirect(url_for("admin.dashboard"))


@admin.route("/admin/api/pdfs")
@admin_required
def api_pdfs():
    pdfs = db.list_pdfs()
    return jsonify([{
        "id":          p["id"],
        "title":       p["title"],
        "size_label":  f"{p['size']/1048576:.2f} MB" if p["size"] >= 1048576 else f"{p['size']/1024:.1f} KB",
        "uploaded_at": p["uploaded_at"].strftime("%d %b %Y"),
    } for p in pdfs])


@admin.route("/admin/api/stats")
@admin_required
def api_stats():
    return jsonify(db.visitor_stats())


@admin.route("/admin/api/visitors")
@admin_required
def api_visitors():
    visitors = db.list_visitors(200)
    return jsonify([{
        "id":          v["id"],
        "ip":          v["ip"],
        "device_name": v.get("device_name") or "",
        "owner_name":  v.get("owner_name") or "",
        "location":    v.get("location") or "",
        "path":        v["path"],
        "visited_at":  v["visited_at"].strftime("%d %b %Y, %H:%M"),
    } for v in visitors])


@admin.route("/admin/delete/<int:pdf_id>", methods=["POST"])
@admin_required
def delete(pdf_id):
    is_ajax = request.headers.get("X-Requested-With") == "XMLHttpRequest"
    pdf = db.get_pdf(pdf_id)
    if pdf:
        try:
            os.remove(os.path.join(UPLOAD_FOLDER, pdf["filename"]))
        except OSError:
            pass
        db.delete_pdf(pdf_id)
        if is_ajax:
            return jsonify({"ok": True})
        flash("PDF deleted.", "success")
    else:
        if is_ajax:
            return jsonify({"error": "Not found"}), 404
        flash("PDF not found.", "error")
    return redirect(url_for("admin.dashboard"))


@admin.route("/admin/pdf/<int:pdf_id>")
@admin_required
def serve_pdf(pdf_id):
    pdf = db.get_pdf(pdf_id)
    if not pdf:
        flash("PDF not found.", "error")
        return redirect(url_for("admin.dashboard"))
    return send_from_directory(UPLOAD_FOLDER, pdf["filename"])


@admin.route("/admin/logout")
def logout():
    session.clear()
    return redirect(url_for("admin.login"))
