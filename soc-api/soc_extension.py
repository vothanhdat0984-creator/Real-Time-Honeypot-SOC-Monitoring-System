"""DẤU VẾT / SOC v4 - Read-only analytics and offline GeoIP for FastAPI.

This module deliberately never exposes passwords, raw authentication JSON,
Docker sockets, or shell execution over HTTP.
"""

from __future__ import annotations

from collections import Counter
from datetime import datetime, timedelta, timezone
from functools import lru_cache
import ipaddress
import json
import os
from pathlib import Path
import subprocess
from typing import Any
from zoneinfo import ZoneInfo

from dotenv import dotenv_values
from fastapi import APIRouter, HTTPException, Query

try:
    import psycopg
    from psycopg.rows import dict_row
except ImportError:  # Users install the addon into their existing soc-venv.
    psycopg = None

try:
    import geoip2.database
    import geoip2.errors
except ImportError:
    geoip2 = None

router = APIRouter(prefix="/api/soc", tags=["Dau Vet SOC - analytics"])
ICT = ZoneInfo("Asia/Ho_Chi_Minh")
GEO_DB = Path(os.getenv("DAUVET_GEO_DB", "/home/socadmin/dauvet-migration/soc-api/GeoLite2-Country.mmdb"))
SENSOR_FILE = Path("/run/dauvet-cowrie-status.json")


@lru_cache(maxsize=1)
def _config() -> dict[str, str]:
    """Reuse the established Docker .env; do not duplicate credentials."""
    settings: dict[str, str] = {}
    for file in ("/opt/dauvet/postgres/.env", "/home/socadmin/dauvet-migration/soc-api/.env"):
        if Path(file).is_file():
            settings.update({k: v for k, v in dotenv_values(file).items() if v is not None})
    settings.update(os.environ)
    return settings


def _setting(*keys: str, default: str = "") -> str:
    config = _config()
    for key in keys:
        if config.get(key):
            return str(config[key])
    return default


def _db():
    if psycopg is None:
        raise HTTPException(status_code=503, detail="Missing psycopg in soc-venv")
    password = _setting("SOC_DB_PASSWORD", "DB_PASSWORD", "POSTGRES_PASSWORD", "PGPASSWORD")
    if not password:
        raise HTTPException(status_code=503, detail="Database password variable not found in existing .env")
    try:
        return psycopg.connect(
            host=_setting("SOC_DB_HOST", default="127.0.0.1"),
            port=int(_setting("SOC_DB_PORT", default="5433")),
            user=_setting("SOC_DB_USER", "DB_USER", "POSTGRES_USER", default="soc_admin"),
            dbname=_setting("SOC_DB_NAME", "DB_NAME", "POSTGRES_DB", default="honeypot_soc"),
            password=password,
            connect_timeout=4,
            options="-c statement_timeout=6000",
            row_factory=dict_row,
        )
    except Exception as e:
        # Do not leak psycopg connection details or credentials in HTTP body.
        raise HTTPException(status_code=503, detail="Database connection unavailable") from e


def _query(cur, statement: str, params: tuple = ()) -> list[dict[str, Any]]:
    cur.execute(statement, params)
    return cur.fetchall()


@lru_cache(maxsize=1)
def _geo_reader():
    if geoip2 is None or not GEO_DB.is_file():
        return None
    try:
        return geoip2.database.Reader(str(GEO_DB))
    except Exception:
        return None


def locate_ip(value: Any) -> dict[str, Any]:
    """No external network queries. RFC1918, CGNAT and other non-global IPs are not countries."""
    try:
        addr = ipaddress.ip_address(str(value))
    except (ValueError, TypeError):
        return {"scope": "invalid", "country_code": None, "country_en": None}
    if not addr.is_global:
        return {"scope": "private", "country_code": None, "country_en": None}
    reader = _geo_reader()
    if not reader:
        return {"scope": "not_configured", "country_code": None, "country_en": None}
    try:
        response = reader.country(str(addr))
        return {"scope": "public", "country_code": response.country.iso_code, "country_en": response.country.name}
    except Exception:
        return {"scope": "unknown", "country_code": None, "country_en": None}


def _local_bucket(row: dict, kind: str) -> str:
    dt = row["bucket"]
    if isinstance(dt, str):
        return dt
    return dt.strftime("%Y-%m-%d %H:%M:%S")


def _window(kind: str):
    now = datetime.now(ICT)
    if kind == "7d":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=6)
        slots = [start + timedelta(days=i) for i in range(7)]
        trunc = "day"
    else:
        start = now.replace(minute=0, second=0, microsecond=0) - timedelta(hours=23)
        slots = [start + timedelta(hours=i) for i in range(24)]
        trunc = "hour"
    return start, slots, trunc


@router.get("/phan-tich")
def analytics(khung: str = Query("24h", pattern="^(24h|7d)$")):
    start, slots, trunc = _window(khung)
    cutoff = start.astimezone(timezone.utc)
    try:
        with _db() as db, db.cursor() as cur:
            bins = _query(cur, f"""
                SELECT date_trunc('{trunc}', event_time AT TIME ZONE 'Asia/Ho_Chi_Minh') AS bucket,
                    count(*) AS events,
                    count(*) FILTER (WHERE event_id = 'cowrie.login.failed') AS failed,
                    count(*) FILTER (WHERE event_id = 'cowrie.command.input') AS commands
                FROM security_events
                WHERE event_time >= %s
                GROUP BY 1 ORDER BY 1
            """, (cutoff,))
            top_ips = _query(cur, """
                SELECT host(src_ip) AS ip, count(*) AS events,
                    count(*) FILTER (WHERE event_id = 'cowrie.login.failed') AS failed,
                    count(*) FILTER (WHERE event_id = 'cowrie.command.input') AS commands
                FROM security_events
                WHERE event_time >= %s AND src_ip IS NOT NULL
                GROUP BY src_ip ORDER BY events DESC, ip ASC LIMIT 12
            """, (cutoff,))
            metrics = _query(cur, """
                SELECT count(*) AS events,
                    count(*) FILTER (WHERE event_id='cowrie.login.failed') AS failed,
                    count(*) FILTER (WHERE event_id='cowrie.command.input') AS commands,
                    count(DISTINCT src_ip) AS unique_ips
                FROM security_events WHERE event_time >= %s
            """, (cutoff,))[0]
            groups = _query(cur, """
                SELECT event_id, count(*) AS count FROM security_events
                WHERE event_time >= %s GROUP BY event_id ORDER BY count DESC LIMIT 12
            """, (cutoff,))
            candidates = _query(cur, """
                SELECT host(src_ip) AS ip, count(*) AS events
                FROM security_events WHERE event_time >= %s AND src_ip IS NOT NULL
                GROUP BY src_ip ORDER BY events DESC LIMIT 250
            """, (cutoff,))
            alert_count = _query(cur, """
                SELECT count(*) FILTER (WHERE lower(coalesce(status,'new')) NOT IN ('closed','resolved','dismissed')) AS open,
                    count(*) FILTER (WHERE lower(coalesce(status,'new')) NOT IN ('closed','resolved','dismissed') AND lower(coalesce(severity,'')) IN ('high','critical')) AS high
                FROM security_alerts
            """)[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=503, detail="Analytics query unavailable") from e

    parsed = {}
    for item in bins:
        key = _local_bucket(item, trunc)[:13] if trunc == "hour" else _local_bucket(item, trunc)[:10]
        parsed[key] = item
    timeline = []
    for slot in slots:
        key = slot.strftime("%Y-%m-%d %H" if trunc == "hour" else "%Y-%m-%d")
        item = parsed.get(key, {})
        timeline.append({
            "bucket": slot.isoformat(),
            "label": slot.strftime("%H:%M" if trunc == "hour" else "%d/%m"),
            "events": int(item.get("events") or 0),
            "failed": int(item.get("failed") or 0),
            "commands": int(item.get("commands") or 0),
        })
    for item in top_ips:
        item.update(locate_ip(item["ip"]))
        for key in ("events", "failed", "commands"):
            item[key] = int(item[key])

    country_totals: dict[str, dict] = {}
    geo_unknown = 0
    for item in candidates:
        geo = locate_ip(item["ip"])
        code = geo.get("country_code")
        if code:
            rec = country_totals.setdefault(code, {"country_code": code, "country_en": geo.get("country_en"), "events": 0, "ips": 0})
            rec["events"] += int(item["events"])
            rec["ips"] += 1
        else:
            geo_unknown += int(item["events"])

    return {
        "window": khung,
        "scope": "postgresql",
        "time_zone": "Asia/Ho_Chi_Minh",
        "from": start.isoformat(),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "metrics": {key: int(value or 0) for key, value in metrics.items()},
        "timeline": timeline,
        "top_ips": top_ips,
        "countries": sorted(country_totals.values(), key=lambda x: (-x["events"], x["country_code"]))[:12],
        "geo_unresolved_events": geo_unknown,
        "geo_database_ready": _geo_reader() is not None,
        "event_types": [{"event_id": row["event_id"], "count": int(row["count"])} for row in groups],
        "alert_summary": {"open": int(alert_count["open"] or 0), "high": int(alert_count["high"] or 0)},
        "geo_coverage_note": "GeoIP applies to public IPs; estimates are not proof of physical origin.",
    }


@router.get("/phien")
def sessions(gioi_han: int = Query(25, ge=1, le=100)):
    try:
        with _db() as db, db.cursor() as cur:
            rows = _query(cur, """
                SELECT session_id, min(event_time) AS started_at, max(event_time) AS last_event_at,
                    (array_agg(host(src_ip) ORDER BY event_time DESC))[1] AS src_ip,
                    count(*) AS events,
                    count(*) FILTER (WHERE event_id='cowrie.command.input') AS commands,
                    count(*) FILTER (WHERE event_id='cowrie.login.failed') AS failed,
                    count(*) FILTER (WHERE event_id='cowrie.login.success') AS successful,
                    count(*) FILTER (WHERE event_id='cowrie.session.closed') > 0 AS closed
                FROM security_events
                WHERE session_id IS NOT NULL AND session_id <> ''
                GROUP BY session_id
                ORDER BY max(event_time) DESC
                LIMIT %s
            """, (gioi_han,))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=503, detail="Session summary unavailable") from e

    for row in rows:
        row.update(locate_ip(row["src_ip"]))
        for key in ("events", "commands", "failed", "successful"):
            row[key] = int(row[key])
    return rows


@router.get("/geo")
def geo_batch(ip: list[str] = Query(default=[])):
    if len(ip) > 100:
        raise HTTPException(status_code=422, detail="Up to 100 IPs per request")
    return {value: locate_ip(value) for value in dict.fromkeys(ip) if len(value) <= 50}


@router.get("/suc-khoe")
def health():
    collector = "unknown"
    try:
        result = subprocess.run(
            ["/usr/bin/systemctl", "is-active", "dauvet-collector.service"],
            capture_output=True, text=True, timeout=2, check=False,
        )
        collector = "online" if result.stdout.strip() == "active" else "offline"
    except Exception:
        pass
    cowrie = "unknown"
    source = "not_verified"
    sensor_checked_at = None
    try:
        stat = SENSOR_FILE.stat()
        if datetime.now(timezone.utc).timestamp() - stat.st_mtime <= 150:
            probe = json.loads(SENSOR_FILE.read_text(encoding="utf-8"))
            if probe.get("state") in ("online", "offline"):
                cowrie = probe["state"]
                source = "docker_container_probe"
                sensor_checked_at = probe.get("checked_at")
    except (FileNotFoundError, OSError, ValueError, TypeError):
        pass
    return {
        "api": "online", "collector": collector,
        "cowrie": cowrie, "cowrie_source": source,
        "cowrie_checked_at": sensor_checked_at,
        "geo_database_ready": _geo_reader() is not None,
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }


def _safe_command(text: str) -> str:
    """Display abbreviated command telemetry, never login password data."""
    import re
    text = re.sub(r"[\x00-\x1f\x7f]", " ", str(text or ""))
    text = re.sub(r"(?i)(password|passwd|token|secret|api[_-]?key)\s*[:=]\s*\S+", r"\1=[REDACTED]", text)
    text = re.sub(r"(?i)(curl\s+[^\n]{0,80}\s-u\s+)\S+", r"\1[REDACTED]", text)
    return text[:180]


@router.get("/lenh")
def recent_commands(gioi_han: int = Query(12, ge=1, le=30)):
    try:
        with _db() as db, db.cursor() as cur:
            rows = _query(cur, """
                SELECT id, host(src_ip) AS src_ip, session_id, event_time,
                    event_data->>'input' AS command
                FROM security_events
                WHERE event_id='cowrie.command.input'
                ORDER BY event_time DESC, id DESC
                LIMIT %s
            """, (gioi_han,))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=503, detail="Command telemetry unavailable") from e
    for row in rows:
        row["command"] = _safe_command(row.get("command"))
    return rows
