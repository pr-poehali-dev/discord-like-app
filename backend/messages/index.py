"""Серверные сообщения: отправка и получение по каналу."""
import json, os
import psycopg2

SCHEMA = "t_p25996638_discord_like_app"

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def cors():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token",
    }

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors(), "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}

    # GET — загрузить сообщения канала
    if method == "GET":
        server_id = params.get("server_id")
        channel_id = params.get("channel_id")
        after_id = params.get("after_id", "0")
        if not server_id or not channel_id:
            return {"statusCode": 400, "headers": cors(), "body": json.dumps({"error": "server_id and channel_id required"})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, user_id, username, avatar_color, text, created_at "
            f"FROM {SCHEMA}.messages "
            f"WHERE server_id=%s AND channel_id=%s AND id > %s "
            f"ORDER BY created_at ASC LIMIT 100",
            (int(server_id), int(channel_id), int(after_id))
        )
        rows = cur.fetchall()
        conn.close()

        messages = [
            {
                "id": r[0],
                "user_id": r[1],
                "username": r[2],
                "avatar_color": r[3],
                "text": r[4],
                "time": r[5].strftime("%H:%M"),
            }
            for r in rows
        ]
        return {"statusCode": 200, "headers": cors(), "body": json.dumps({"messages": messages})}

    # POST — отправить сообщение
    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        server_id = body.get("server_id")
        channel_id = body.get("channel_id")
        user_id = body.get("user_id")
        username = body.get("username", "")
        avatar_color = body.get("avatar_color", "#00ff88")
        text = (body.get("text") or "").strip()

        if not all([server_id, channel_id, user_id, username, text]):
            return {"statusCode": 400, "headers": cors(), "body": json.dumps({"error": "missing fields"})}
        if len(text) > 2000:
            return {"statusCode": 400, "headers": cors(), "body": json.dumps({"error": "too long"})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.messages (server_id, channel_id, user_id, username, avatar_color, text) "
            f"VALUES (%s, %s, %s, %s, %s, %s) RETURNING id, created_at",
            (server_id, channel_id, user_id, username, avatar_color, text)
        )
        row = cur.fetchone()
        conn.commit()
        conn.close()

        return {
            "statusCode": 200,
            "headers": cors(),
            "body": json.dumps({
                "id": row[0],
                "user_id": user_id,
                "username": username,
                "avatar_color": avatar_color,
                "text": text,
                "time": row[1].strftime("%H:%M"),
            })
        }

    return {"statusCode": 405, "headers": cors(), "body": json.dumps({"error": "method not allowed"})}
