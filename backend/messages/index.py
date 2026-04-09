"""Серверные сообщения: отправка, получение, редактирование, удаление, файлы."""
import json, os, base64, uuid
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

    # GET — загрузить сообщения канала
    if method == "GET":
        server_id = params.get("server_id")
        channel_id = params.get("channel_id")
        after_id = params.get("after_id", "0")
        before_id = params.get("before_id")
        limit = min(int(params.get("limit", "50")), 100)
        if not server_id or not channel_id:
            return {"statusCode": 400, "headers": cors(), "body": json.dumps({"error": "server_id and channel_id required"})}

        conn = get_conn()
        cur = conn.cursor()
        sql = (
            f"SELECT id, user_id, username, avatar_color, text, created_at, file_url, file_name, file_type, "
            f"edited, is_removed, reply_to_id, reply_to_text, reply_to_user, mentions "
            f"FROM {SCHEMA}.messages "
            f"WHERE server_id=%s AND channel_id=%s AND id > %s"
        )
        args = [int(server_id), int(channel_id), int(after_id)]
        if before_id:
            sql += " AND id < %s"
            args.append(int(before_id))
        sql += f" ORDER BY created_at ASC LIMIT {limit}"
        cur.execute(sql, args)
        rows = cur.fetchall()

        # Реакции одним запросом
        msg_ids = [r[0] for r in rows]
        reactions_map: dict = {}
        if msg_ids:
            in_clause = ",".join(str(i) for i in msg_ids)
            cur.execute(
                f"SELECT message_id, emoji, COUNT(*) as cnt, array_agg(user_id) as uids "
                f"FROM {SCHEMA}.reactions WHERE message_id IN ({in_clause}) "
                f"GROUP BY message_id, emoji"
            )
            for rr in cur.fetchall():
                if rr[0] not in reactions_map:
                    reactions_map[rr[0]] = []
                reactions_map[rr[0]].append({"emoji": rr[1], "count": rr[2], "user_ids": rr[3]})

        conn.close()

        messages = []
        for r in rows:
            messages.append({
                "id": r[0], "user_id": r[1], "username": r[2], "avatar_color": r[3],
                "text": "Сообщение удалено" if r[10] else r[4],
                "time": r[5].strftime("%H:%M"), "date": r[5].strftime("%Y-%m-%d"),
                "file_url": r[6], "file_name": r[7], "file_type": r[8],
                "edited": r[9], "is_removed": r[10],
                "reply_to_id": r[11], "reply_to_text": r[12], "reply_to_user": r[13],
                "mentions": r[14],
                "reactions": reactions_map.get(r[0], []),
            })
        return {"statusCode": 200, "headers": cors(), "body": json.dumps({"messages": messages})}

    # POST — отправить сообщение (с файлом или без)
    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        server_id = body.get("server_id")
        channel_id = body.get("channel_id")
        user_id = body.get("user_id")
        username = body.get("username", "")
        avatar_color = body.get("avatar_color", "#00ff88")
        text = (body.get("text") or "").strip()
        file_data = body.get("file_data")
        file_name = body.get("file_name")
        file_type = body.get("file_type")
        reply_to_id = body.get("reply_to_id")
        reply_to_text = (body.get("reply_to_text") or "")[:200]
        reply_to_user = body.get("reply_to_user", "")
        mentions = body.get("mentions", "")  # comma-separated usernames

        if not all([server_id, channel_id, user_id, username]) or (not text and not file_data):
            return {"statusCode": 400, "headers": cors(), "body": json.dumps({"error": "missing fields"})}
        if text and len(text) > 2000:
            return {"statusCode": 400, "headers": cors(), "body": json.dumps({"error": "too long"})}

        file_url = None
        if file_data and file_name:
            try:
                s3 = get_s3()
                ext = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else "bin"
                key = f"chat/{uuid.uuid4().hex}.{ext}"
                raw = base64.b64decode(file_data)
                s3.put_object(Bucket="files", Key=key, Body=raw, ContentType=file_type or "application/octet-stream")
                file_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
            except Exception as e:
                return {"statusCode": 500, "headers": cors(), "body": json.dumps({"error": f"upload failed: {str(e)}"})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.messages (server_id, channel_id, user_id, username, avatar_color, text, file_url, file_name, file_type, reply_to_id, reply_to_text, reply_to_user, mentions) "
            f"VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id, created_at",
            (server_id, channel_id, user_id, username, avatar_color, text or "", file_url, file_name, file_type,
             reply_to_id, reply_to_text, reply_to_user, mentions)
        )
        row = cur.fetchone()
        conn.commit()
        conn.close()

        return {
            "statusCode": 200,
            "headers": cors(),
            "body": json.dumps({
                "id": row[0], "user_id": user_id, "username": username, "avatar_color": avatar_color,
                "text": text or "", "time": row[1].strftime("%H:%M"), "date": row[1].strftime("%Y-%m-%d"),
                "file_url": file_url, "file_name": file_name, "file_type": file_type,
                "edited": False, "is_removed": False, "reactions": [],
                "reply_to_id": reply_to_id, "reply_to_text": reply_to_text, "reply_to_user": reply_to_user,
                "mentions": mentions,
            })
        }

    # PUT — редактировать или пометить как удалённое
    if method == "PUT":
        body = json.loads(event.get("body") or "{}")
        msg_id = body.get("id")
        user_id = body.get("user_id")
        action = body.get("action", "edit")

        if not msg_id or not user_id:
            return {"statusCode": 400, "headers": cors(), "body": json.dumps({"error": "id and user_id required"})}

        conn = get_conn()
        cur = conn.cursor()

        cur.execute(f"SELECT user_id FROM {SCHEMA}.messages WHERE id=%s", (int(msg_id),))
        row = cur.fetchone()
        if not row or row[0] != int(user_id):
            conn.close()
            return {"statusCode": 403, "headers": cors(), "body": json.dumps({"error": "forbidden"})}

        if action == "remove":
            cur.execute(f"UPDATE {SCHEMA}.messages SET is_removed=TRUE WHERE id=%s", (int(msg_id),))
        else:
            new_text = (body.get("text") or "").strip()
            if not new_text:
                conn.close()
                return {"statusCode": 400, "headers": cors(), "body": json.dumps({"error": "text required"})}
            cur.execute(
                f"UPDATE {SCHEMA}.messages SET text=%s, edited=TRUE WHERE id=%s",
                (new_text, int(msg_id))
            )

        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": cors(), "body": json.dumps({"ok": True})}

    return {"statusCode": 405, "headers": cors(), "body": json.dumps({"error": "method not allowed"})}