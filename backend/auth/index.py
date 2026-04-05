"""
Авторизация пользователей: регистрация, вход, получение профиля.
"""
import json
import os
import hashlib
import secrets
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Token",
}

COLORS = ["#00ff88", "#ff00aa", "#00aaff", "#aa00ff", "#ff6600", "#ffcc00"]


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def make_token(user_id: int) -> str:
    return hashlib.sha256(f"{user_id}{secrets.token_hex(16)}".encode()).hexdigest()


def resp(status: int, data: dict) -> dict:
    return {"statusCode": status, "headers": CORS, "body": data}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "")
    schema = os.environ.get("MAIN_DB_SCHEMA", "public")

    # --- REGISTER ---
    if method == "POST" and (path.endswith("/register") or action == "register"):
        body = json.loads(event.get("body") or "{}")
        username = (body.get("username") or "").strip()
        email = (body.get("email") or "").strip().lower()
        password = body.get("password") or ""

        if not username or not email or not password:
            return resp(400, {"error": "Заполните все поля"})
        if len(username) < 3:
            return resp(400, {"error": "Имя пользователя минимум 3 символа"})
        if len(password) < 6:
            return resp(400, {"error": "Пароль минимум 6 символов"})

        color = COLORS[hash(username) % len(COLORS)]

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"SELECT id FROM {schema}.users WHERE username = %s OR email = %s", (username, email))
        if cur.fetchone():
            conn.close()
            return resp(409, {"error": "Пользователь уже существует"})

        pw_hash = hash_password(password)
        cur.execute(
            f"INSERT INTO {schema}.users (username, email, password_hash, avatar_color) VALUES (%s, %s, %s, %s) RETURNING id",
            (username, email, pw_hash, color)
        )
        user_id = cur.fetchone()[0]
        conn.commit()
        conn.close()

        token = make_token(user_id)
        return resp(200, {
            "token": token,
            "user": {"id": user_id, "username": username, "email": email, "avatar_color": color, "status": "online"}
        })

    # --- LOGIN ---
    if method == "POST" and (path.endswith("/login") or action == "login"):
        body = json.loads(event.get("body") or "{}")
        login = (body.get("login") or "").strip().lower()
        password = body.get("password") or ""

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, username, email, avatar_color, status FROM {schema}.users WHERE (LOWER(username) = %s OR email = %s) AND password_hash = %s",
            (login, login, hash_password(password))
        )
        row = cur.fetchone()
        conn.close()

        if not row:
            return resp(401, {"error": "Неверный логин или пароль"})

        user_id, username, email, avatar_color, status = row
        token = make_token(user_id)
        return resp(200, {
            "token": token,
            "user": {"id": user_id, "username": username, "email": email, "avatar_color": avatar_color, "status": status}
        })

    # --- CHECK (health) ---
    if method == "GET":
        return resp(200, {"ok": True})

    return resp(404, {"error": "Not found"})