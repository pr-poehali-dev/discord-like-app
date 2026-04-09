"""ЛС: сообщения, диалоги, поиск пользователей, друзья, редактирование."""
import json, os
import psycopg2

SCHEMA = "t_p25996638_discord_like_app"

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def cors():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token",
    }

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors(), "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    body = {}
    if method in ("POST", "PUT"):
        body = json.loads(event.get("body") or "{}")
        if not action:
            action = body.get("action", "")

    conn = get_conn()
    cur = conn.cursor()

    try:
        # ── GET сообщения диалога ────────────────────────────
        if method == "GET" and not action:
            user_a = params.get("user_a")
            user_b = params.get("user_b")
            after_id = params.get("after_id", "0")
            before_id = params.get("before_id")
            limit = min(int(params.get("limit", "50")), 100)

            if not user_a or not user_b:
                return {"statusCode": 400, "headers": cors(), "body": json.dumps({"error": "user_a and user_b required"})}

            sql = (
                f"SELECT id, from_user_id, text, created_at, is_removed, edited, file_url, file_name, file_type "
                f"FROM {SCHEMA}.dm_messages "
                f"WHERE LEAST(from_user_id, to_user_id) = LEAST(%s, %s) "
                f"AND GREATEST(from_user_id, to_user_id) = GREATEST(%s, %s) "
                f"AND id > %s "
            )
            args = [int(user_a), int(user_b), int(user_a), int(user_b), int(after_id)]
            if before_id:
                sql += " AND id < %s "
                args.append(int(before_id))
            sql += f"ORDER BY created_at ASC LIMIT {limit}"

            cur.execute(sql, args)
            rows = cur.fetchall()
            messages = [
                {
                    "id": r[0],
                    "from_user_id": r[1],
                    "text": "Сообщение удалено" if r[4] else r[2],
                    "time": r[3].strftime("%H:%M"),
                    "date": r[3].strftime("%d.%m.%Y"),
                    "is_removed": r[4],
                    "edited": r[5],
                    "file_url": r[6],
                    "file_name": r[7],
                    "file_type": r[8],
                }
                for r in rows
            ]
            return {"statusCode": 200, "headers": cors(), "body": json.dumps({"messages": messages})}

        # ── GET список диалогов ──────────────────────────────
        if action == "conversations":
            user_id = int(params.get("user_id") or body.get("user_id"))
            cur.execute(
                f"""
                SELECT DISTINCT ON (partner_id)
                    partner_id,
                    u.username,
                    u.avatar_color,
                    u.status,
                    last_msg,
                    last_time,
                    COALESCE(op.last_seen > NOW() - INTERVAL '30 seconds', FALSE) as is_online
                FROM (
                    SELECT
                        CASE WHEN from_user_id = %s THEN to_user_id ELSE from_user_id END as partner_id,
                        text as last_msg,
                        created_at as last_time
                    FROM {SCHEMA}.dm_messages
                    WHERE (from_user_id = %s OR to_user_id = %s) AND is_removed = FALSE
                    ORDER BY created_at DESC
                ) sub
                JOIN {SCHEMA}.users u ON u.id = sub.partner_id
                LEFT JOIN {SCHEMA}.online_presence op ON op.user_id = u.id
                ORDER BY partner_id, last_time DESC
                """,
                (user_id, user_id, user_id)
            )
            rows = cur.fetchall()
            convos = [
                {
                    "user_id": r[0],
                    "username": r[1],
                    "avatar_color": r[2],
                    "status": r[3],
                    "last_msg": r[4],
                    "last_time": r[5].strftime("%H:%M"),
                    "is_online": r[6],
                }
                for r in rows
            ]
            return {"statusCode": 200, "headers": cors(), "body": json.dumps({"conversations": convos})}

        # ── GET поиск пользователей ──────────────────────────
        if action == "search_users":
            query = (params.get("q") or "").strip()
            user_id = params.get("user_id")
            if not query or len(query) < 2:
                return {"statusCode": 400, "headers": cors(), "body": json.dumps({"error": "query too short"})}
            cur.execute(
                f"SELECT u.id, u.username, u.avatar_color, u.status, "
                f"COALESCE(op.last_seen > NOW() - INTERVAL '30 seconds', FALSE) as is_online "
                f"FROM {SCHEMA}.users u "
                f"LEFT JOIN {SCHEMA}.online_presence op ON op.user_id = u.id "
                f"WHERE LOWER(u.username) LIKE LOWER(%s) AND u.id != %s "
                f"LIMIT 20",
                (f"%{query}%", int(user_id) if user_id else 0)
            )
            rows = cur.fetchall()
            users = [{"id": r[0], "username": r[1], "avatar_color": r[2], "status": r[3], "is_online": r[4]} for r in rows]
            return {"statusCode": 200, "headers": cors(), "body": json.dumps({"users": users})}

        # ── GET друзья ────────────────────────────────────────
        if action == "friends":
            user_id = int(params.get("user_id") or 0)
            status_filter = params.get("status", "accepted")
            cur.execute(
                f"""
                SELECT u.id, u.username, u.avatar_color, u.status as user_status, f.status as friend_status,
                    COALESCE(op.last_seen > NOW() - INTERVAL '30 seconds', FALSE) as is_online,
                    CASE WHEN f.user_id = %s THEN 'outgoing' ELSE 'incoming' END as direction
                FROM {SCHEMA}.friends f
                JOIN {SCHEMA}.users u ON u.id = CASE WHEN f.user_id = %s THEN f.friend_id ELSE f.user_id END
                LEFT JOIN {SCHEMA}.online_presence op ON op.user_id = u.id
                WHERE (f.user_id = %s OR f.friend_id = %s) AND f.status = %s
                ORDER BY u.username ASC
                """,
                (user_id, user_id, user_id, user_id, status_filter)
            )
            rows = cur.fetchall()
            friends = [
                {
                    "id": r[0], "username": r[1], "avatar_color": r[2],
                    "user_status": r[3], "friend_status": r[4],
                    "is_online": r[5], "direction": r[6],
                }
                for r in rows
            ]
            return {"statusCode": 200, "headers": cors(), "body": json.dumps({"friends": friends})}

        # ── POST отправить сообщение ─────────────────────────
        if method == "POST" and action in ("", "send"):
            from_user_id = body.get("from_user_id")
            to_user_id = body.get("to_user_id")
            text = (body.get("text") or "").strip()
            if not all([from_user_id, to_user_id]) or not text:
                return {"statusCode": 400, "headers": cors(), "body": json.dumps({"error": "missing fields"})}
            if len(text) > 2000:
                return {"statusCode": 400, "headers": cors(), "body": json.dumps({"error": "too long"})}
            cur.execute(
                f"INSERT INTO {SCHEMA}.dm_messages (from_user_id, to_user_id, text) "
                f"VALUES (%s, %s, %s) RETURNING id, created_at",
                (int(from_user_id), int(to_user_id), text)
            )
            row = cur.fetchone()
            conn.commit()
            return {"statusCode": 200, "headers": cors(), "body": json.dumps({
                "id": row[0], "from_user_id": from_user_id, "text": text,
                "time": row[1].strftime("%H:%M"), "date": row[1].strftime("%d.%m.%Y"),
                "is_removed": False, "edited": False,
            })}

        # ── POST добавить друга ───────────────────────────────
        if action == "add_friend":
            user_id = int(body.get("user_id"))
            friend_username = (body.get("username") or "").strip()
            if not friend_username:
                return {"statusCode": 400, "headers": cors(), "body": json.dumps({"error": "username required"})}
            cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE LOWER(username)=LOWER(%s)", (friend_username,))
            row = cur.fetchone()
            if not row:
                return {"statusCode": 404, "headers": cors(), "body": json.dumps({"error": "user not found"})}
            friend_id = row[0]
            if friend_id == user_id:
                return {"statusCode": 400, "headers": cors(), "body": json.dumps({"error": "cannot add yourself"})}
            cur.execute(
                f"INSERT INTO {SCHEMA}.friends (user_id, friend_id, status) VALUES (%s, %s, 'pending') "
                f"ON CONFLICT (user_id, friend_id) DO NOTHING",
                (user_id, friend_id)
            )
            conn.commit()
            return {"statusCode": 200, "headers": cors(), "body": json.dumps({"ok": True, "friend_id": friend_id})}

        # ── POST принять/отклонить заявку ─────────────────────
        if action == "respond_friend":
            user_id = int(body.get("user_id"))
            friend_id = int(body.get("friend_id"))
            accept = body.get("accept", False)
            if accept:
                cur.execute(
                    f"UPDATE {SCHEMA}.friends SET status='accepted' "
                    f"WHERE user_id=%s AND friend_id=%s AND status='pending'",
                    (friend_id, user_id)
                )
                cur.execute(
                    f"INSERT INTO {SCHEMA}.friends (user_id, friend_id, status) VALUES (%s, %s, 'accepted') "
                    f"ON CONFLICT (user_id, friend_id) DO UPDATE SET status='accepted'",
                    (user_id, friend_id)
                )
            else:
                cur.execute(
                    f"UPDATE {SCHEMA}.friends SET status='rejected' "
                    f"WHERE ((user_id=%s AND friend_id=%s) OR (user_id=%s AND friend_id=%s)) AND status='pending'",
                    (friend_id, user_id, user_id, friend_id)
                )
            conn.commit()
            return {"statusCode": 200, "headers": cors(), "body": json.dumps({"ok": True})}

        # ── POST удалить друга ────────────────────────────────
        if action == "remove_friend":
            user_id = int(body.get("user_id"))
            friend_id = int(body.get("friend_id"))
            cur.execute(
                f"UPDATE {SCHEMA}.friends SET status='removed' "
                f"WHERE (user_id=%s AND friend_id=%s) OR (user_id=%s AND friend_id=%s)",
                (user_id, friend_id, friend_id, user_id)
            )
            conn.commit()
            return {"statusCode": 200, "headers": cors(), "body": json.dumps({"ok": True})}

        # ── PUT редактировать/удалить сообщение ───────────────
        if method == "PUT":
            msg_id = body.get("id")
            user_id = body.get("user_id")
            edit_action = body.get("action", "edit")
            if not msg_id or not user_id:
                return {"statusCode": 400, "headers": cors(), "body": json.dumps({"error": "id and user_id required"})}
            cur.execute(f"SELECT from_user_id FROM {SCHEMA}.dm_messages WHERE id=%s", (int(msg_id),))
            row = cur.fetchone()
            if not row or row[0] != int(user_id):
                return {"statusCode": 403, "headers": cors(), "body": json.dumps({"error": "forbidden"})}
            if edit_action == "remove":
                cur.execute(f"UPDATE {SCHEMA}.dm_messages SET is_removed=TRUE WHERE id=%s", (int(msg_id),))
            else:
                new_text = (body.get("text") or "").strip()
                if not new_text:
                    return {"statusCode": 400, "headers": cors(), "body": json.dumps({"error": "text required"})}
                cur.execute(f"UPDATE {SCHEMA}.dm_messages SET text=%s, edited=TRUE WHERE id=%s", (new_text, int(msg_id)))
            conn.commit()
            return {"statusCode": 200, "headers": cors(), "body": json.dumps({"ok": True})}

        return {"statusCode": 400, "headers": cors(), "body": json.dumps({"error": f"unknown action: {action}"})}

    finally:
        conn.close()
