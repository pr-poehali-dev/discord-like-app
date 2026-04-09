"""Личные сообщения: отправка и получение между двумя пользователями."""
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

    # GET — загрузить сообщения между двумя пользователями
    if method == "GET":
        user_a = params.get("user_a")
        user_b = params.get("user_b")
        after_id = params.get("after_id", "0")
        if not user_a or not user_b:
            return {"statusCode": 400, "headers": cors(), "body": json.dumps({"error": "user_a and user_b required"})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, from_user_id, text, created_at "
            f"FROM {SCHEMA}.dm_messages "
            f"WHERE LEAST(from_user_id, to_user_id) = LEAST(%s, %s) "
            f"  AND GREATEST(from_user_id, to_user_id) = GREATEST(%s, %s) "
            f"  AND id > %s "
            f"ORDER BY created_at ASC LIMIT 100",
            (int(user_a), int(user_b), int(user_a), int(user_b), int(after_id))
        )
        rows = cur.fetchall()
        conn.close()

        messages = [
            {
                "id": r[0],
                "from_user_id": r[1],
                "text": r[2],
                "time": r[3].strftime("%H:%M"),
            }
            for r in rows
        ]
        return {"statusCode": 200, "headers": cors(), "body": json.dumps({"messages": messages})}

    # POST — отправить личное сообщение
    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        from_user_id = body.get("from_user_id")
        to_user_id = body.get("to_user_id")
        text = (body.get("text") or "").strip()

        if not all([from_user_id, to_user_id, text]):
            return {"statusCode": 400, "headers": cors(), "body": json.dumps({"error": "missing fields"})}
        if len(text) > 2000:
            return {"statusCode": 400, "headers": cors(), "body": json.dumps({"error": "too long"})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.dm_messages (from_user_id, to_user_id, text) "
            f"VALUES (%s, %s, %s) RETURNING id, created_at",
            (from_user_id, to_user_id, text)
        )
        row = cur.fetchone()
        conn.commit()
        conn.close()

        return {
            "statusCode": 200,
            "headers": cors(),
            "body": json.dumps({
                "id": row[0],
                "from_user_id": from_user_id,
                "text": text,
                "time": row[1].strftime("%H:%M"),
            })
        }

    return {"statusCode": 405, "headers": cors(), "body": json.dumps({"error": "method not allowed"})}
