release: python manage.py collectstatic --noinput && python manage.py migrate
web: gunicorn lms_api.wsgi
