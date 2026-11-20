import os

from dotenv import load_dotenv

load_dotenv()

APP_HOST = os.getenv("APP_HOST", "127.0.0.1")
APP_PORT = int(os.getenv("APP_PORT", "8000"))
REFRESH_MINUTES = int(os.getenv("REFRESH_MINUTES", "15"))

EMAIL = os.getenv("ATLASSIAN_EMAIL", "")
API_TOKEN = os.getenv("ATLASSIAN_API_TOKEN", "")

PORTALS = {
    code: {
        "url": os.getenv(f"JIRA_{code}_URL", "").rstrip("/"),
        "name": f"Site {code[-1]}",
    }
    for code in ("SITE_A", "SITE_B", "SITE_C")
}


def _queries_for_region(code):
    queries = {}
    ticket_jql = os.getenv(f"JIRA_{code}_JQL", "").strip()
    secondary_jql = os.getenv(f"JIRA_{code}_SECONDARY_JQL", "").strip()
    if ticket_jql:
        queries["Tickets"] = ticket_jql
    if secondary_jql:
        queries["Additional Requests"] = secondary_jql
    return queries


JQLS = {code: _queries_for_region(code) for code in PORTALS}

FIELDS = [
    "summary",
    "status",
    "assignee",
    "created",
    "updated",
    "duedate",
    "priority",
    "issuetype",
    "project",
    "reporter",
    "resolution",
]
