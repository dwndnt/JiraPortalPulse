import json, sqlite3
from pathlib import Path
DB_PATH = Path(__file__).resolve().parents[1] / "data" / "jira_cache.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

def _connect():
    conn=sqlite3.connect(DB_PATH)
    conn.execute('''CREATE TABLE IF NOT EXISTS snapshot (
        id INTEGER PRIMARY KEY CHECK(id=1), refreshed_at TEXT, payload TEXT NOT NULL)''')
    return conn

def save_snapshot(tickets, refreshed_at, errors, query_counts):
    payload=json.dumps({"tickets":tickets,"errors":errors,"query_counts":query_counts},ensure_ascii=False)
    with _connect() as conn:
        conn.execute("INSERT OR REPLACE INTO snapshot(id,refreshed_at,payload) VALUES(1,?,?)",(refreshed_at,payload))

def load_snapshot():
    with _connect() as conn:
        row=conn.execute("SELECT refreshed_at,payload FROM snapshot WHERE id=1").fetchone()
    if not row: return {"refreshed_at":None,"tickets":[],"errors":[],"query_counts":{}}
    return {"refreshed_at":row[0],**json.loads(row[1])}
