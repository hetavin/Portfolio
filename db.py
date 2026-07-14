import pymysql
import pymysql.cursors
from config import DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_DATABASE


def get_conn():
    return pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_DATABASE,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True,
    )


def init_db():
    conn = get_conn()
    with conn:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS visitors (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ip VARCHAR(45)   NOT NULL DEFAULT '',
                user_agent  TEXT,
                device_name VARCHAR(150)  DEFAULT '',
                owner_name  VARCHAR(150)  DEFAULT '',
                location    VARCHAR(255)  DEFAULT '',
                path        VARCHAR(255)  NOT NULL DEFAULT '/',
                referrer    VARCHAR(500)  DEFAULT '',
                tz_offset   SMALLINT      NOT NULL DEFAULT 0,
                visited_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS pdfs (
                    id            INT AUTO_INCREMENT PRIMARY KEY,
                    title         VARCHAR(255)  NOT NULL,
                    filename      VARCHAR(255)  NOT NULL,
                    original_name VARCHAR(255)  NOT NULL DEFAULT '',
                    size          BIGINT        NOT NULL DEFAULT 0,
                    file_data     LONGBLOB,
                    uploaded_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS resume_chunks (
                    id         INT AUTO_INCREMENT PRIMARY KEY,
                    pdf_id     INT  NOT NULL,
                    chunk_text TEXT NOT NULL,
                    FOREIGN KEY (pdf_id) REFERENCES pdfs(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)


# ── Visitors ──────────────────────────────────────────────────────────────────

def add_visitor(ip, user_agent, path, referrer="", device_name="", location="", owner_name="", tz_offset=0):
    from datetime import datetime, timezone, timedelta
    utc_now = datetime.now(timezone.utc).replace(tzinfo=None)
    # Store the visitor's ACTUAL local time (UTC shifted by their timezone offset)
    local_now = utc_now + timedelta(minutes=int(tz_offset or 0))
    conn = get_conn()
    with conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO visitors (ip, user_agent, device_name, owner_name, location, path, referrer, tz_offset, visited_at) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
                (ip, user_agent, device_name, owner_name, location, path, referrer, tz_offset, local_now),
            )


def update_visitor_location(ip, location):
    conn = get_conn()
    with conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE visitors SET location=%s WHERE ip=%s ORDER BY visited_at DESC LIMIT 1",
                (location, ip),
            )


def visitor_stats():
    conn = get_conn()
    with conn:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) AS total FROM visitors")
            total = cur.fetchone()["total"]

            cur.execute("SELECT COUNT(DISTINCT ip) AS unique_ips FROM visitors")
            unique = cur.fetchone()["unique_ips"]

            cur.execute("SELECT COUNT(*) AS today FROM visitors WHERE DATE(visited_at) = CURDATE()")
            today = cur.fetchone()["today"]

            cur.execute("SELECT COUNT(*) AS pdfs FROM pdfs")
            pdfs = cur.fetchone()["pdfs"]

    return {"total": total, "unique": unique, "today": today, "pdfs": pdfs}


def list_visitors(limit=200):
    conn = get_conn()
    with conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT v.* FROM visitors v
                INNER JOIN (
                    SELECT ip, MAX(visited_at) AS last_visit FROM visitors GROUP BY ip
                ) u ON v.ip = u.ip AND v.visited_at = u.last_visit
                ORDER BY v.visited_at DESC LIMIT %s
                """,
                (limit,),
            )
            return cur.fetchall()


# ── PDFs ──────────────────────────────────────────────────────────────────────

def add_pdf(title, filename, original_name, size, file_data=None):
    conn = get_conn()
    with conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO pdfs (title, filename, original_name, size, file_data) VALUES (%s, %s, %s, %s, %s)",
                (title, filename, original_name, size, file_data),
            )
            return cur.lastrowid


def list_pdfs():
    conn = get_conn()
    with conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id, title, filename, original_name, size, uploaded_at FROM pdfs ORDER BY uploaded_at DESC")
            return cur.fetchall()


def get_pdf(pdf_id):
    conn = get_conn()
    with conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id, title, filename, original_name, size, uploaded_at FROM pdfs WHERE id = %s", (pdf_id,))
            return cur.fetchone()


def get_pdf_blob(pdf_id):
    conn = get_conn()
    with conn:
        with conn.cursor() as cur:
            cur.execute("SELECT file_data, filename FROM pdfs WHERE id = %s", (pdf_id,))
            return cur.fetchone()


def get_pdf_by_filename(filename):
    conn = get_conn()
    with conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM pdfs WHERE filename = %s", (filename,))
            return cur.fetchone()


# ── Resume Chunks ─────────────────────────────────────────────────────────────

def save_chunks(pdf_id, chunks):
    conn = get_conn()
    with conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM resume_chunks WHERE pdf_id = %s", (pdf_id,))
            cur.executemany(
                "INSERT INTO resume_chunks (pdf_id, chunk_text) VALUES (%s, %s)",
                [(pdf_id, c) for c in chunks],
            )


def get_all_chunks():
    conn = get_conn()
    with conn:
        with conn.cursor() as cur:
            cur.execute("SELECT chunk_text FROM resume_chunks ORDER BY id")
            return [r["chunk_text"] for r in cur.fetchall()]


def delete_pdf(pdf_id):
    conn = get_conn()
    with conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM pdfs WHERE id = %s", (pdf_id,))
