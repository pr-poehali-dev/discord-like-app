"""API: серверы, реакции, поиск — всё в одном endpoint через ?action="""
import json, os, uuid, base64
import psycopg2
import boto3

SCHEMA = "t_p25996638_discord_like_app"

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def cors():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token",
    }

def get_s3():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )

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
        # ── СЕРВЕРЫ ──────────────────────────────────────────
        if action == "get_servers":
            user_id = params.get("user_id") or body.get("user_id")
            cur.execute(
                f"SELECT s.id, s.name, s.abbr, s.color, s.owner_id, "
                f"(SELECT COUNT(*) FROM {SCHEMA}.server_members sm2 WHERE sm2.server_id=s.id) "
                f"FROM {SCHEMA}.servers s "
                f"JOIN {SCHEMA}.server_members sm ON sm.server_id=s.id "
                f"WHERE sm.user_id=%s ORDER BY s.created_at ASC",
                (int(user_id),)
            )
            rows = cur.fetchall()
            servers = [{"id": r[0], "name": r[1], "abbr": r[2], "color": r[3], "owner_id": r[4], "members": r[5]} for r in rows]
            return {"statusCode": 200, "headers": cors(), "body": json.dumps({"servers": servers})}

        if action == "create_server":
            name = (body.get("name") or "").strip()
            owner_id = int(body.get("owner_id"))
            color = body.get("color", "#00ff88")
            abbr = body.get("abbr") or ("".join(w[0].upper() for w in name.split()[:2]) or name[:2].upper())
            cur.execute(
                f"INSERT INTO {SCHEMA}.servers (name, abbr, color, owner_id) VALUES (%s,%s,%s,%s) RETURNING id",
                (name, abbr, color, owner_id)
            )
            server_id = cur.fetchone()[0]
            cur.execute(
                f"INSERT INTO {SCHEMA}.channels (server_id, name, type, position) VALUES "
                f"(%s,'общий','text',0),(%s,'медиа','text',1),(%s,'объявления','text',2),(%s,'голосовой','voice',0)",
                (server_id, server_id, server_id, server_id)
            )
            cur.execute(
                f"INSERT INTO {SCHEMA}.server_members (server_id, user_id, role) VALUES (%s,%s,'admin') "
                f"ON CONFLICT DO NOTHING",
                (server_id, owner_id)
            )
            conn.commit()
            return {"statusCode": 200, "headers": cors(), "body": json.dumps(
                {"id": server_id, "name": name, "abbr": abbr, "color": color, "owner_id": owner_id, "members": 1}
            )}

        if action == "join_server":
            server_id = int(body.get("server_id"))
            user_id = int(body.get("user_id"))
            cur.execute(
                f"INSERT INTO {SCHEMA}.server_members (server_id, user_id, role) VALUES (%s,%s,'member') "
                f"ON CONFLICT DO NOTHING",
                (server_id, user_id)
            )
            conn.commit()
            cur.execute(
                f"SELECT s.id, s.name, s.abbr, s.color, s.owner_id, "
                f"(SELECT COUNT(*) FROM {SCHEMA}.server_members sm2 WHERE sm2.server_id=s.id) "
                f"FROM {SCHEMA}.servers s WHERE s.id=%s",
                (server_id,)
            )
            r = cur.fetchone()
            if not r:
                return {"statusCode": 404, "headers": cors(), "body": json.dumps({"error": "not found"})}
            return {"statusCode": 200, "headers": cors(), "body": json.dumps(
                {"id": r[0], "name": r[1], "abbr": r[2], "color": r[3], "owner_id": r[4], "members": r[5]}
            )}

        if action == "remove_server":
            server_id = int(body.get("server_id"))
            user_id = int(body.get("user_id"))
            cur.execute(f"SELECT owner_id FROM {SCHEMA}.servers WHERE id=%s", (server_id,))
            row = cur.fetchone()
            if not row:
                return {"statusCode": 404, "headers": cors(), "body": json.dumps({"error": "not found"})}
            cur.execute(
                f"SELECT role FROM {SCHEMA}.server_members WHERE server_id=%s AND user_id=%s",
                (server_id, user_id)
            )
            member = cur.fetchone()
            is_owner = row[0] == user_id
            is_admin = member and member[0] == "admin"
            if not is_owner and not is_admin:
                return {"statusCode": 403, "headers": cors(), "body": json.dumps({"error": "forbidden"})}
            cur.execute(f"UPDATE {SCHEMA}.messages SET is_removed=TRUE WHERE server_id=%s", (server_id,))
            cur.execute(f"UPDATE {SCHEMA}.channels SET locked=TRUE WHERE server_id=%s", (server_id,))
            cur.execute(f"UPDATE {SCHEMA}.server_members SET role='removed' WHERE server_id=%s", (server_id,))
            cur.execute(f"UPDATE {SCHEMA}.servers SET name=CONCAT('[DELETED] ', name) WHERE id=%s", (server_id,))
            conn.commit()
            return {"statusCode": 200, "headers": cors(), "body": json.dumps({"ok": True})}

        if action == "get_channels":
            server_id = int(params.get("server_id") or body.get("server_id"))
            cur.execute(
                f"SELECT id, name, type, locked, position FROM {SCHEMA}.channels "
                f"WHERE server_id=%s ORDER BY position ASC, id ASC",
                (server_id,)
            )
            rows = cur.fetchall()
            channels = [{"id": r[0], "name": r[1], "type": r[2], "locked": r[3], "position": r[4]} for r in rows]
            return {"statusCode": 200, "headers": cors(), "body": json.dumps({"channels": channels})}

        if action == "get_members":
            server_id = int(params.get("server_id") or body.get("server_id"))
            cur.execute(
                f"SELECT u.id, u.username, u.avatar_color, u.status, sm.role, "
                f"COALESCE(op.status, 'offline') as online_status, op.last_seen "
                f"FROM {SCHEMA}.server_members sm "
                f"JOIN {SCHEMA}.users u ON u.id=sm.user_id "
                f"LEFT JOIN {SCHEMA}.online_presence op ON op.user_id=u.id "
                f"WHERE sm.server_id=%s ORDER BY sm.role ASC, u.username ASC",
                (server_id,)
            )
            rows = cur.fetchall()
            import datetime
            members = []
            for r in rows:
                is_online = r[6] and (r[6] > datetime.datetime.now(tz=r[6].tzinfo) - datetime.timedelta(seconds=30))
                members.append({
                    "id": r[0], "username": r[1], "avatar_color": r[2],
                    "status": r[4] if is_online else "offline",
                    "online_status": r[5] if is_online else "offline",
                    "role": r[4],
                })
            return {"statusCode": 200, "headers": cors(), "body": json.dumps({"members": members})}

        # ── РЕАКЦИИ ──────────────────────────────────────────
        if action == "get_reactions":
            message_ids_str = params.get("message_ids", "") or body.get("message_ids", "")
            if not message_ids_str:
                return {"statusCode": 200, "headers": cors(), "body": json.dumps({"reactions": {}})}
            message_ids = [int(x) for x in str(message_ids_str).split(",") if x.strip()]
            placeholders = ",".join(["%s"] * len(message_ids))
            cur.execute(
                f"SELECT message_id, emoji, COUNT(*), ARRAY_AGG(user_id) "
                f"FROM {SCHEMA}.message_reactions WHERE message_id IN ({placeholders}) "
                f"GROUP BY message_id, emoji",
                message_ids
            )
            rows = cur.fetchall()
            result = {}
            for r in rows:
                mid = str(r[0])
                if mid not in result:
                    result[mid] = []
                result[mid].append({"emoji": r[1], "count": r[2], "user_ids": r[3]})
            return {"statusCode": 200, "headers": cors(), "body": json.dumps({"reactions": result})}

        if action == "toggle_reaction":
            message_id = int(body.get("message_id"))
            user_id = int(body.get("user_id"))
            emoji = body.get("emoji", "")
            cur.execute(
                f"SELECT id FROM {SCHEMA}.message_reactions WHERE message_id=%s AND user_id=%s AND emoji=%s",
                (message_id, user_id, emoji)
            )
            existing = cur.fetchone()
            if existing:
                cur.execute(f"UPDATE {SCHEMA}.message_reactions SET emoji=CONCAT(emoji,'_off') WHERE id=%s", (existing[0],))
                removed = True
            else:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.message_reactions (message_id, user_id, emoji) VALUES (%s,%s,%s)",
                    (message_id, user_id, emoji)
                )
                removed = False
            conn.commit()
            cur.execute(
                f"SELECT COUNT(*) FROM {SCHEMA}.message_reactions WHERE message_id=%s AND emoji=%s",
                (message_id, emoji)
            )
            count = cur.fetchone()[0]
            return {"statusCode": 200, "headers": cors(), "body": json.dumps({"count": count, "removed": removed})}

        # ── ПОИСК ────────────────────────────────────────────
        if action == "search":
            query = (params.get("q") or body.get("q") or "").strip()
            search_type = params.get("type") or body.get("type", "messages")
            server_id = params.get("server_id") or body.get("server_id")

            if not query or len(query) < 2:
                return {"statusCode": 400, "headers": cors(), "body": json.dumps({"error": "query too short"})}

            if search_type == "users":
                cur.execute(
                    f"SELECT id, username, avatar_color, status FROM {SCHEMA}.users "
                    f"WHERE LOWER(username) LIKE LOWER(%s) LIMIT 20",
                    (f"%{query}%",)
                )
                rows = cur.fetchall()
                users = [{"id": r[0], "username": r[1], "avatar_color": r[2], "status": r[3]} for r in rows]
                return {"statusCode": 200, "headers": cors(), "body": json.dumps({"users": users})}

            sql = (
                f"SELECT m.id, m.server_id, m.channel_id, m.username, m.avatar_color, m.text, m.created_at "
                f"FROM {SCHEMA}.messages m "
                f"WHERE LOWER(m.text) LIKE LOWER(%s) AND m.is_removed=FALSE "
            )
            args = [f"%{query}%"]
            if server_id:
                sql += " AND m.server_id=%s"
                args.append(int(server_id))
            sql += " ORDER BY m.created_at DESC LIMIT 30"
            cur.execute(sql, args)
            rows = cur.fetchall()
            messages = [
                {"id": r[0], "server_id": r[1], "channel_id": r[2], "username": r[3],
                 "avatar_color": r[4], "text": r[5], "time": r[6].strftime("%H:%M"), "date": r[6].strftime("%d.%m.%Y")}
                for r in rows
            ]
            return {"statusCode": 200, "headers": cors(), "body": json.dumps({"messages": messages})}

        # ── ЗАГРУЗКА ФАЙЛА ────────────────────────────────────
        if action == "upload_file":
            file_data = body.get("file_data")
            file_name = body.get("file_name", "file")
            file_type = body.get("file_type", "application/octet-stream")
            if not file_data:
                return {"statusCode": 400, "headers": cors(), "body": json.dumps({"error": "file_data required"})}
            s3 = get_s3()
            ext = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else "bin"
            key = f"chat/{uuid.uuid4().hex}.{ext}"
            raw = base64.b64decode(file_data)
            s3.put_object(Bucket="files", Key=key, Body=raw, ContentType=file_type)
            url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
            return {"statusCode": 200, "headers": cors(), "body": json.dumps({"url": url, "file_name": file_name, "file_type": file_type})}

        return {"statusCode": 400, "headers": cors(), "body": json.dumps({"error": f"unknown action: {action}"})}

    finally:
        conn.close()