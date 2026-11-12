
import sys
import os
import json
import hmac
import hashlib
import ipaddress

from pathlib import Path
from datetime import datetime, timezone

import psycopg
from psycopg.types.json import Jsonb
from dotenv import load_dotenv


# ==========================================
# CAU HINH HE THONG SOC
# ==========================================

NGUONG_CANH_BAO = 5
THOI_GIAN_THEO_DOI = 60
RULE_ID = "SSH_BRUTE_FORCE"

# Doc mat khau PostgreSQL
duong_dan_env = Path("/opt/dauvet/postgres/.env")
load_dotenv(duong_dan_env)

mat_khau = os.getenv("POSTGRES_PASSWORD")

if not mat_khau:
    sys.exit("[LOI] Khong tim thay mat khau database")


# ==========================================
# CHUAN HOA DU LIEU
# ==========================================

def chuan_hoa_ip(ip):
    try:
        return str(ipaddress.ip_address(ip))
    except (ValueError, TypeError):
        return None


def chuan_hoa_thoi_gian(value):
    if not value:
        return None

    try:
        dt = datetime.fromisoformat(
            str(value).replace("Z", "+00:00")
        )

        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)

        return dt

    except (ValueError, TypeError):
        return None


# Che thong tin nhay cam truoc khi luu
TRUONG_BI_AN = {
    "password",
    "passwd",
    "secret",
    "token",
    "api_key",
    "authorization",
    "private_key"
}


def an_thong_tin(data):
    if isinstance(data, dict):
        return {
            key: (
                "[DA AN]"
                if key.lower() in TRUONG_BI_AN
                else an_thong_tin(value)
            )
            for key, value in data.items()
        }

    if isinstance(data, list):
        return [an_thong_tin(item) for item in data]

    return data


# ==========================================
# KET NOI POSTGRESQL
# ==========================================

try:
    conn = psycopg.connect(
        host="127.0.0.1",
        port=5433,
        dbname="honeypot_soc",
        user="soc_admin",
        password=mat_khau,
        connect_timeout=5,
        autocommit=True
    )

except psycopg.Error as error:
    sys.exit(f"[LOI] Ket noi PostgreSQL that bai: {error}")


print("=" * 50, flush=True)
print("HE THONG GIAM SAT HONEYPOT SOC", flush=True)
print("[SOC] Da ket noi PostgreSQL", flush=True)
print("[SOC] Dang cho su kien...", flush=True)


# ==========================================
# XU LY SU KIEN COWRIE
# ==========================================

def xu_ly_su_kien(event):

    event_id = str(event.get("eventid") or "unknown")
    ip_nguon = chuan_hoa_ip(event.get("src_ip"))
    ma_phien = str(event.get("session") or "")

    thoi_gian = chuan_hoa_thoi_gian(
        event.get("timestamp")
    )

    # Tao ma dinh danh de tranh ghi trung
    raw = json.dumps(
        event,
        sort_keys=True,
        ensure_ascii=False,
        separators=(",", ":")
    )

    event_hash = hmac.new(
        mat_khau.encode("utf-8"),
        raw.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    du_lieu_an_toan = an_thong_tin(event)

    # Luu su kien vao database
    with conn.transaction():

        result = conn.execute(
            """
            INSERT INTO security_events
            (
                event_hash,
                event_id,
                src_ip,
                session_id,
                event_time,
                event_data
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (event_hash) DO NOTHING
            RETURNING id
            """,
            (
                event_hash,
                event_id[:100],
                ip_nguon,
                ma_phien[:100],
                thoi_gian,
                Jsonb(du_lieu_an_toan)
            )
        ).fetchone()

        if result is None:
            print("[TRUNG] Bo qua su kien da luu", flush=True)
            return

        print(
            f"[DA LUU] {event_id} | IP: {ip_nguon}",
            flush=True
        )

        # Phat hien do mat khau SSH
        if (
            event_id != "cowrie.login.failed"
            or not ip_nguon
            or not thoi_gian
        ):
            return

        # Khong tao canh bao tu log qua cu
        do_tre = (
            datetime.now(timezone.utc) - thoi_gian
        ).total_seconds()

        if do_tre < 0 or do_tre > 120:
            return

        # Dem so lan dang nhap that bai
        so_lan = conn.execute(
            """
            SELECT COUNT(*)
            FROM security_events
            WHERE event_id = 'cowrie.login.failed'
              AND src_ip = %s
              AND event_time BETWEEN
                  %s::timestamptz
                    - INTERVAL '60 seconds'
                  AND %s::timestamptz
            """,
            (ip_nguon, thoi_gian, thoi_gian)
        ).fetchone()[0]

        if so_lan < NGUONG_CANH_BAO:
            return

        # Tranh tao canh bao lien tuc
        da_canh_bao = conn.execute(
            """
            SELECT 1
            FROM security_alerts
            WHERE rule_id = %s
              AND src_ip = %s
              AND created_at >=
                  NOW() - INTERVAL '60 seconds'
            LIMIT 1
            """,
            (RULE_ID, ip_nguon)
        ).fetchone()

        if da_canh_bao:
            return

        alert_hash = hashlib.sha256(
            (RULE_ID + ip_nguon + event_hash).encode()
        ).hexdigest()

        # Ghi canh bao vao PostgreSQL
        conn.execute(
            """
            INSERT INTO security_alerts
            (
                alert_hash,
                rule_id,
                severity,
                src_ip,
                attempt_count,
                time_window_seconds,
                details
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (alert_hash) DO NOTHING
            """,
            (
                alert_hash,
                RULE_ID,
                "high",
                ip_nguon,
                so_lan,
                THOI_GIAN_THEO_DOI,
                Jsonb({
                    "mitre": "T1110.001",
                    "detection": "ssh_password_guessing"
                })
            )
        )

        print(
            f"[CANH BAO CAO] Nghi van do mat khau: {ip_nguon}",
            flush=True
        )


# ==========================================
# DOC NHAT KY JSON LIEN TUC
# ==========================================

try:
    for dong in sys.stdin:

        if not dong.strip():
            continue

        try:
            event = json.loads(dong)

            if not isinstance(event, dict):
                continue

            xu_ly_su_kien(event)

        except json.JSONDecodeError:
            print("[LOI] JSON khong hop le", flush=True)

        except psycopg.Error as error:
            sys.exit(f"[LOI DATABASE] {error}")

except KeyboardInterrupt:
    print("\n[SOC] Da dung thu thap", flush=True)

finally:
    conn.close()
