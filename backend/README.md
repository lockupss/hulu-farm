This folder contains a minimal Django API scaffold.

Setup (local dev):

python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

The project exposes simple API endpoints under `/api/` for forum, weather, market, and notifications. This is a scaffold — run `django-admin startproject` if you want a full project structure.
