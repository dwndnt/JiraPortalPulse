import requests
from requests.auth import HTTPBasicAuth
from config import EMAIL, API_TOKEN, FIELDS

class JiraClient:
    def __init__(self, base_url):
        if not EMAIL or not API_TOKEN:
            raise RuntimeError("ATLASSIAN_EMAIL / ATLASSIAN_API_TOKEN belum diisi di .env")
        self.base_url = base_url.rstrip("/")
        self.session = requests.Session()
        self.session.auth = HTTPBasicAuth(EMAIL, API_TOKEN)
        self.session.headers.update({"Accept":"application/json","Content-Type":"application/json"})

    def myself(self):
        r = self.session.get(f"{self.base_url}/rest/api/3/myself", timeout=30)
        r.raise_for_status()
        return r.json()

    def search_jql(self, jql, page_size=100):
        issues, token = [], None
        while True:
            payload = {"jql":jql, "maxResults":page_size, "fields":FIELDS}
            if token: payload["nextPageToken"] = token
            r = self.session.post(f"{self.base_url}/rest/api/3/search/jql", json=payload, timeout=60)
            r.raise_for_status()
            data = r.json()
            issues.extend(data.get("issues",[]))
            token = data.get("nextPageToken")
            if not token or not data.get("issues"): break
        return issues
