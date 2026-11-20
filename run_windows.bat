@echo off
cd /d "%~dp0"
if not exist .venv py -m venv .venv
call .venv\Scripts\activate
python -m pip install -r requirements.txt
if not exist .env (
  copy .env.example .env
  echo Add Atlassian email and API token to .env
  notepad .env
  pause
)
start "" http://127.0.0.1:8000
python app.py
