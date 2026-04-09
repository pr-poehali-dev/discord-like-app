"""Онлайн-присутствие: heartbeat и список онлайн пользователей сервера."""
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

    # GET — онлайн пользователи (за последние 30 секунд)
    if method == "GET":
        server_id = params.get("server_id")
        conn = get_conn()
        cur = conn.cursor()

        if server_id:
            cur.execute(
                f"SELECT u.id, u.username, u.avatar_color, op.status "
                f"FROM {SCHEMA}.online_presence op "
                f"JOIN {SCHEMA}.users u ON u.id = op.user_id "
                f"JOIN {SCHEMA}.server_members sm ON sm.user_id = op.user_id AND sm.server_id = %s "
                f"WHERE op.last_seen > NOW() - INTERVAL '30 seconds' "
                f"ORDER BY u.username ASC",
                (int(server_id),)
            )
        else:
            cur.execute(
                f"SELECT u.id, u.username, u.avatar_color, op.status "
                f"FROM {SCHEMA}.online_presence op "
                f"JOIN {SCHEMA}.users u ON u.id = op.user_id "
                f"WHERE op.last_seen > NOW() - INTERVAL '30 seconds' "
                f"ORDER BY u.username ASC"
            )

        rows = cur.fetchall()
        conn.close()
        users = [{"id": r[0], "username": r[1], "avatar_color": r[2], "status": r[3]} for r in rows]
        return {"statusCode": 200, "headers": cors(), "body": json.dumps({"online": users})}

    # POST — heartbeat (обновить время онлайн)
    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        user_id = body.get("user_id")
        status = body.get("status", "online")

        if not user_id:
            return {"statusCode": 400, "headers": cors(), "body": json.dumps({"error": "user_id required"})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.online_presence (user_id, last_seen, status) VALUES (%s, NOW(), %s) "
            f"ON CONFLICT (user_id) DO UPDATE SET last_seen=NOW(), status=%s",
            (int(user_id), status, status)
        )
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": cors(), "body": json.dumps({"ok": True})}

    return {"statusCode": 405, "headers": cors(), "body": json.dumps({"error": "method not allowed"})}
