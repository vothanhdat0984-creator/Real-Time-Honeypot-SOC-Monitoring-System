
import os
from pathlib import Path

import psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query


# ==========================================
# CAU HINH KET NOI CO SO DU LIEU SOC
# ==========================================

duong_dan_env = Path("/opt/dauvet/postgres/.env")
load_dotenv(duong_dan_env)

mat_khau = os.getenv("POSTGRES_PASSWORD")

if not mat_khau:
    raise RuntimeError("Khong tim thay mat khau PostgreSQL")


# ==========================================
# KHOI TAO FASTAPI
# ==========================================

app = FastAPI(
    title="He thong Giam sat Honeypot SOC",
    description="API cung cap su kien va canh bao bao mat",
    version="1.0.0"
)


# ==========================================
# HAM TRUY VAN POSTGRESQL
# ==========================================

def truy_van(sql, tham_so=()):
    try:
        with psycopg.connect(
            host="127.0.0.1",
            port=5433,
            dbname="honeypot_soc",
            user="soc_admin",
            password=mat_khau,
            connect_timeout=5,
            row_factory=dict_row,
            options="-c default_transaction_read_only=on"
        ) as ket_noi:

            with ket_noi.cursor() as con_tro:
                con_tro.execute(sql, tham_so)
                return con_tro.fetchall()

    except psycopg.Error as loi:
        raise HTTPException(
            status_code=503,
            detail="Co so du lieu tam thoi khong kha dung"
        ) from loi


# ==========================================
# API 1 - KIEM TRA TRANG THAI
# ==========================================

@app.get("/api/trang-thai")
def trang_thai():
    truy_van("SELECT 1")

    return {
        "trang_thai": "hoat_dong",
        "database": "da_ket_noi",
        "he_thong": "Honeypot SOC"
    }


# ==========================================
# API 2 - THONG KE TONG QUAN
# ==========================================

@app.get("/api/tong-quan")
def tong_quan():

    sql = """
        SELECT
            (
                SELECT COUNT(*)
                FROM security_events
            ) AS tong_su_kien,

            (
                SELECT COUNT(DISTINCT src_ip)
                FROM security_events
                WHERE src_ip IS NOT NULL
            ) AS so_ip_nguon,

            (
                SELECT COUNT(*)
                FROM security_events
                WHERE event_id = 'cowrie.login.failed'
            ) AS dang_nhap_that_bai,

            (
                SELECT COUNT(*)
                FROM security_alerts
            ) AS tong_canh_bao
    """

    return truy_van(sql)[0]


# ==========================================
# API 3 - DANH SACH SU KIEN
# ==========================================

@app.get("/api/su-kien")
def danh_sach_su_kien(
    gioi_han: int = Query(default=20, ge=1, le=100)
):

    sql = """
        SELECT
            id,
            event_id,
            host(src_ip) AS src_ip,
            session_id,
            event_time
        FROM security_events
        ORDER BY id DESC
        LIMIT %s
    """

    return truy_van(sql, (gioi_han,))


# ==========================================
# API 4 - DANH SACH CANH BAO
# ==========================================

@app.get("/api/canh-bao")
def danh_sach_canh_bao(
    gioi_han: int = Query(default=20, ge=1, le=100)
):

    sql = """
        SELECT
            id,
            rule_id,
            severity,
            host(src_ip) AS src_ip,
            attempt_count,
            time_window_seconds,
            status,
            created_at
        FROM security_alerts
        ORDER BY id DESC
        LIMIT %s
    """

    return truy_van(sql, (gioi_han,))


# DAUVET_V4_ROUTER
from soc_extension import router as dauvet_soc_v4_router
app.include_router(dauvet_soc_v4_router)
