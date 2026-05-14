#!/bin/sh
# =============================================================================
# Backend container entrypoint
# Runs migrations automatically before starting Gunicorn.
# =============================================================================
set -e

echo "[entrypoint] Waiting for database to be ready..."
until python -c "
import sys, os
import dj_database_url
import psycopg2
url = os.environ.get('DATABASE_URL', '')
if not url:
    sys.exit(0)
cfg = dj_database_url.parse(url)
try:
    conn = psycopg2.connect(
        dbname=cfg['NAME'], user=cfg['USER'],
        password=cfg['PASSWORD'], host=cfg['HOST'], port=cfg['PORT'],
        connect_timeout=3
    )
    conn.close()
except Exception as e:
    print(f'  DB not ready: {e}')
    sys.exit(1)
"; do
    sleep 2
done
echo "[entrypoint] Database is ready."

echo "[entrypoint] Running migrations..."
python manage.py migrate --noinput

echo "[entrypoint] Starting Gunicorn (workers=3, timeout=600s)..."
exec gunicorn lms_api.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --timeout 600 \
    --access-logfile - \
    --error-logfile - \
    --log-level info
