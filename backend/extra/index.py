"""Extra: typing indicators, pinned messages, server invites, categories."""
import json, os, random, string
from datetime import timezone
import datetime
import psycopg2

SCHEMA = "t_p25996638_discord_like_app"

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def cors():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token",
    }

def handler(event: dict, context) -> dict:
    """Typing, pinned, invites, categories."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors(), "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    body = {}
    if method in ("POST", "PUT", "DELETE"):
        body = json.loads(event.get("body") or "{}")
        if not action:
            action = body.get("action", "")

    conn = get_conn()
    cur = conn.cursor()

    try:
        # ── TYPING ───────────────────────────────────────────
        if action == "typing_start":
            server_id = int(body.get("server_id"))
            channel_id = int(body.get("channel_id"))
            user_id = int(body.get("user_id"))
            username = body.get("username", "")
            cur.execute(
                f"INSERT INTO {SCHEMA}.typing_indicators (server_id, channel_id, user_id, username, last_typed) "
                f"VALUES (%s,%s,%s,%s,NOW()) "
                f"ON CONFLICT (channel_id, user_id) DO UPDATE SET last_typed=NOW(), username=%s",
                (server_id, channel_id, user_id, username, username)
            )
            conn.commit()
            return {"statusCode": 200, "headers": cors(), "body": json.dumps({"ok": True})}

        if action == "typing_list":
            channel_id = int(params.get("channel_id", 0))
            user_id = int(params.get("user_id", 0))
            cur.execute(
                f"SELECT username FROM {SCHEMA}.typing_indicators "
                f"WHERE channel_id=%s AND user_id != %s AND last_typed > NOW() - INTERVAL '5 seconds'",
                (channel_id, user_id)
            )
            return {"statusCode": 200, "headers": cors(), "body": json.dumps({"typing": [r[0] for r in cur.fetchall()]})}

        # ── PINNED ───────────────────────────────────────────
        if action == "pin_message":
            server_id = int(body.get("server_id"))
            channel_id = int(body.get("channel_id"))
            message_id = int(body.get("message_id"))
            pinned_by = int(body.get("user_id"))
            cur.execute(
                f"INSERT INTO {SCHEMA}.pinned_messages (server_id, channel_id, message_id, pinned_by) "
                f"VALUES (%s,%s,%s,%s) ON CONFLICT (channel_id, message_id) DO NOTHING",
                (server_id, channel_id, message_id, pinned_by)
            )
            conn.commit()
            return {"statusCode": 200, "headers": cors(), "body": json.dumps({"ok": True})}

        if action == "unpin_message":
            channel_id = int(body.get("channel_id"))
            message_id = int(body.get("message_id"))
            cur.execute(
                f"DELETE FROM {SCHEMA}.pinned_messages WHERE channel_id=%s AND message_id=%s",
                (channel_id, message_id)
            )
            conn.commit()
            return {"statusCode": 200, "headers": cors(), "body": json.dumps({"ok": True})}

        if action == "get_pinned":
            channel_id = int(params.get("channel_id", 0))
            cur.execute(
                f"SELECT m.id, m.user_id, m.username, m.avatar_color, m.text, m.created_at, p.pinned_at "
                f"FROM {SCHEMA}.pinned_messages p "
                f"JOIN {SCHEMA}.messages m ON m.id = p.message_id "
                f"WHERE p.channel_id=%s AND m.is_removed=FALSE "
                f"ORDER BY p.pinned_at DESC LIMIT 50",
                (channel_id,)
            )
            pinned = [
                {"id": r[0], "user_id": r[1], "username": r[2], "avatar_color": r[3],
                 "text": r[4], "time": r[5].strftime("%H:%M"), "pinned_at": r[6].strftime("%d.%m.%Y %H:%M")}
                for r in cur.fetchall()
            ]
            return {"statusCode": 200, "headers": cors(), "body": json.dumps({"pinned": pinned})}

        # ── ИНВАЙТЫ ──────────────────────────────────────────
        if action == "create_invite":
            server_id = int(body.get("server_id"))
            created_by = int(body.get("user_id"))
            max_uses = body.get("max_uses")
            code = "".join(random.choices(string.ascii_letters + string.digits, k=8))
            cur.execute(
                f"INSERT INTO {SCHEMA}.server_invites (server_id, code, created_by, max_uses) "
                f"VALUES (%s,%s,%s,%s) RETURNING id, code",
                (server_id, code, created_by, max_uses)
            )
            row = cur.fetchone()
            conn.commit()
            return {"statusCode": 200, "headers": cors(), "body": json.dumps({"invite_id": row[0], "code": row[1]})}

        if action == "get_invite_info":
            code = params.get("code", "").strip()
            cur.execute(
                f"SELECT i.code, i.uses, i.max_uses, s.id, s.name, s.abbr, s.color, "
                f"(SELECT COUNT(*) FROM {SCHEMA}.server_members WHERE server_id=s.id) "
                f"FROM {SCHEMA}.server_invites i JOIN {SCHEMA}.servers s ON s.id=i.server_id "
                f"WHERE i.code=%s", (code,)
            )
            row = cur.fetchone()
            if not row:
                return {"statusCode": 404, "headers": cors(), "body": json.dumps({"error": "not found"})}
            return {"statusCode": 200, "headers": cors(), "body": json.dumps({
                "code": row[0], "uses": row[1], "max_uses": row[2],
                "server_id": row[3], "server_name": row[4], "server_abbr": row[5],
                "server_color": row[6], "members": int(row[7]),
            })}

        if action == "use_invite":
            code = (body.get("code") or "").strip()
            user_id = int(body.get("user_id"))
            cur.execute(
                f"SELECT id, server_id, uses, max_uses, expires_at FROM {SCHEMA}.server_invites WHERE code=%s", (code,)
            )
            row = cur.fetchone()
            if not row:
                return {"statusCode": 404, "headers": cors(), "body": json.dumps({"error": "Инвайт не найден"})}
            invite_id, server_id, uses, max_uses, expires_at = row
            if max_uses and uses >= max_uses:
                return {"statusCode": 410, "headers": cors(), "body": json.dumps({"error": "Инвайт исчерпан"})}
            if expires_at and expires_at.replace(tzinfo=timezone.utc) < datetime.datetime.now(timezone.utc):
                return {"statusCode": 410, "headers": cors(), "body": json.dumps({"error": "Инвайт истёк"})}
            cur.execute(
                f"INSERT INTO {SCHEMA}.server_members (server_id, user_id) VALUES (%s,%s) ON CONFLICT DO NOTHING",
                (server_id, user_id)
            )
            cur.execute(f"UPDATE {SCHEMA}.server_invites SET uses=uses+1 WHERE id=%s", (invite_id,))
            cur.execute(f"SELECT name, abbr, color FROM {SCHEMA}.servers WHERE id=%s", (server_id,))
            s = cur.fetchone()
            conn.commit()
            return {"statusCode": 200, "headers": cors(), "body": json.dumps({
                "ok": True, "server_id": server_id,
                "server_name": s[0] if s else "", "server_abbr": s[1] if s else "", "server_color": s[2] if s else "#00ff88"
            })}

        return {"statusCode": 400, "headers": cors(), "body": json.dumps({"error": f"unknown action: {action}"})}

    finally:
        conn.close()
