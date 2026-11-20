from apscheduler.schedulers.background import BackgroundScheduler
from config import REFRESH_MINUTES
from services.ticket_service import refresh_all
scheduler=BackgroundScheduler()
def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(refresh_all,"interval",minutes=max(1,REFRESH_MINUTES),id="jira_refresh",replace_existing=True)
        scheduler.start()
        try: refresh_all()
        except Exception as exc: print("Initial Jira refresh failed:",exc)
def stop_scheduler():
    if scheduler.running: scheduler.shutdown(wait=False)
