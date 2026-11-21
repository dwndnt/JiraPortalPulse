# PortalPulse Wiki — Home

Welcome to the official documentation wiki for **PortalPulse**, a high-performance local Jira monitoring dashboard designed for individual engineers, system analysts, and technical leads who manage multiple Jira portals.

---

## 🧭 Navigation

* **[Project Overview & Motivation](./wiki.md#1-project-overview--motivation)** — Background, objectives, and core value proposition.
* **[System Architecture](./wiki.md#2-system-architecture)** — Architecture overview, component breakdown, and data flow.
* **[Features & Functionalities](./wiki.md#3-features--functionalities)** — Module breakdown and interactive capabilities.
* **[Technical Documentation](./wiki.md#4-technical-documentation)** — Source code structure, backend, frontend, and API endpoints.
* **[Data Management & Processing](./wiki.md#5-data-management--processing)** — JQL handling, pagination, normalization, and snapshot persistence.
* **[Security & Privacy](./wiki.md#6-security--privacy)** — Credential handling, local-first deployment, and data protection.
* **[Installation & Configuration](./wiki.md#7-installation--configuration)** — Setup guide, `.env` parameters, and running instructions.
* **[Limitations & Future Development](./wiki.md#8-limitations--future-development)** — System boundaries, technical considerations, and roadmap.
* **[Author & Project Philosophy](./wiki.md#9-author--project-philosophy)** — Creator profile, personal motivation, and design philosophy.

---

<hr style="border: 0; height: 1px; background: #26334d; margin: 40px 0;">

# 1. Project Overview & Motivation

Managing multiple Jira instances or portals simultaneously often results in fragmented visibility, slow browser switching, and cumbersome status tracking across disconnected projects. 

### Background & Problem Statement
* **Scattered Dashboards:** Navigating between multiple Atlassian cloud instances requires frequent logins, context switching, and manual filtering.
* **Performance Overhead:** Native Jira dashboards can suffer from slow load times when aggregating complex queries across multiple domains.
* **Lack of Unified Local Control:** Developers and analysts often need a lightweight, self-hosted tool that keeps data local and executes fast without relying on heavy enterprise extensions.

### Objectives & Benefits
* **Unified Visibility:** Aggregate tickets from multiple Jira portals (`SITE_A`, `SITE_B`, `SITE_C`) into a single, cohesive interface.
* **Lightning-Fast Responsiveness:** Leverage a local SQLite caching layer so that UI interactions, filters, and searches render instantly.
* **Zero Cloud Dependencies:** Keep all operational data and credentials strictly on the local machine.

---

<hr style="border: 0; height: 1px; background: #26334d; margin: 40px 0;">

# 2. System Architecture

PortalPulse is built on a decoupled client-server architecture running entirely within a local environment.

### Architecture Diagram
```
┌─────────────────┐       REST API v3       ┌──────────────────────┐
│                 │ ──────────────────────> │                      │
│   Jira Server   │                         │  JiraClient (Python) │
│ (Site A/B/C)    │ <────────────────────── │                      │
│                 │      JSON Payload       └──────────┬───────────┘
└─────────────────%                                  │
                                                     ▼
┌─────────────────<──────────────────────── ┌──────────────────────┐
│  FastAPI Backend                          │  SQLite Cache Store  │
│  - RESTful Endpoints                      │  (data/jira_cache.db)│
│  - APScheduler Background Worker          │                      │
└────────┬────────┘                         └──────────────────────┘
         │
         │ Static assets & JSON API responses
         ▼
┌──────────────────────────────────────────┐
│  Frontend Client (Browser UI)            │
│  - Chart.js Visualizations               │
│  - Client-side Filtering & Live Search   │
└──────────────────────────────────────────┘
```

### Key Integration Points
* **Jira REST API v3:** Communicates securely via HTTP Basic Authentication (`ATLASSIAN_EMAIL` + `ATLASSIAN_API_TOKEN`).
* **Background Worker (`APScheduler`):** Periodically polls Jira servers in the background according to `REFRESH_MINUTES` without blocking the main application thread.
* **Local Persistence (`SQLite`):** Stores normalized JSON snapshots (`snapshot` table) for instantaneous retrieval upon client request.

---

<hr style="border: 0; height: 1px; background: #26334d; margin: 40px 0;">

# 3. Features & Functionalities

PortalPulse provides two primary operational views within its workspace:

### A. Overview & Metrics (`main-dashboard`)
* **Metric Summary Cards:** Total tickets, open/active tickets count, and individual breakdown counts for Site A, Site B, and Site C.
* **Interactive Charts (Chart.js):**
  * *Ticket Distribution:* Bar chart showing issue volume per site.
  * *Status Distribution:* Stacked bar chart breaking down status categories across sites.
  * *Assignee Distribution:* Doughnut charts highlighting top assignees per site with percentage share.
* **Ticket Inventory Table:** Comprehensive data grid supporting real-time text search, status dropdown filtering, site filtering, and direct links to Jira issues.

### B. Additional Requests (`additional-dashboard`)
* Dedicated secondary workspace designed for tracking auxiliary JQL queries, specialized request queues, or supplementary tracking items across sites.
* Filterable by specific site (`SITE_A`, `SITE_B`, `SITE_C`) or viewed globally (`ALL`).

---

<hr style="border: 0; height: 1px; background: #26334d; margin: 40px 0;">

# 4. Technical Documentation

### Source Code Structure
```
PortalPulse/
├── app.py                     # FastAPI entrypoint & router
├── config.py                  # Environment loader & configuration
├── requirements.txt           # Python package dependencies
├── run_windows.bat            # Windows startup batch script
├── connectors/
│   └── jira_client.py         # Jira REST API client wrapper
├── services/
│   ├── db.py                  # SQLite database connection & persistence
│   ├── sync_service.py        # APScheduler background sync manager
│   └── ticket_service.py      # Data normalization & business logic
└── frontend/
    ├── index.html             # Single-page dashboard UI
    ├── dashboard.js           # Client-side logic & Chart.js rendering
    └── dashboard.css          # Modern dark-theme stylesheet
```

### Backend & API Specifications
* **Framework:** FastAPI (Python)
* **API Endpoints:**
  * `GET /` — Serves frontend `index.html`.
  * `GET /api/health` — System health check.
  * `GET /api/dashboard` — Retrieves cached ticket inventory and summary metrics.
  * `GET /api/additional-dashboard?site={SITE}` — Retrieves secondary request data.
  * `POST /api/refresh` — Triggers manual synchronization with Jira servers.

---

<hr style="border: 0; height: 1px; background: #26334d; margin: 40px 0;">

# 5. Data Management & Processing

### JQL Execution & Pagination
* Queries are defined per portal in [`config.py`](./d:/Ngoding/jiradashboard/JiraPortalPulse/config.py) using custom JQL strings.
* [`connectors/jira_client.py`](./d:/Ngoding/jiradashboard/JiraPortalPulse/connectors/jira_client.py) implements automated pagination using `nextPageToken` to handle large result sets robustly.

### Normalization & Snapshot Persistence
* Raw Jira responses are normalized into a clean, uniform dictionary structure containing essential keys (`id`, `portal`, `portal_name`, `query`, `key`, `url`, `summary`, `status`, `status_category`, `assignee`, `reporter`, `priority`, `issue_type`, `project`, `created`, `updated`, `due_date`, `resolution`).
* Data is stored as a serialized JSON payload inside a single-row SQLite table (`snapshot`), ensuring fast atomic reads and writes.

---

<hr style="border: 0; height: 1px; background: #26334d; margin: 40px 0;">

# 6. Security & Privacy

* **Credential Isolation:** Atlassian credentials (`ATLASSIAN_EMAIL` and `ATLASSIAN_API_TOKEN`) reside exclusively in the local `.env` file on the backend. They are never exposed to the frontend browser or transmitted to third parties.
* **Local-First Deployment:** PortalPulse runs entirely on localhost (`127.0.0.1`). No external telemetry or cloud logging services are utilized.
* **Risk Mitigation:** Since credentials are stored locally, users must ensure their local machine environment and `.env` files are properly secured.

---

<hr style="border: 0; height: 1px; background: #26334d; margin: 40px 0;">

# 7. Installation & Configuration

### Prerequisites
* Python 3.9 or higher.

### Step 1: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Configure Environment (`.env`)
Create a `.env` file based on `.env.example`:
```env
APP_HOST=127.0.0.1
APP_PORT=8000
REFRESH_MINUTES=15

ATLASSIAN_EMAIL=your-email@domain.com
ATLASSIAN_API_TOKEN=your-api-token

JIRA_SITE_A_URL=https://domain-a.atlassian.net
JIRA_SITE_A_JQL=project = "PROJA" AND status != Done
```

### Step 3: Run the Application
```bash
python app.py
```
Open your browser at: **`http://127.0.0.1:8000`**

---

<hr style="border: 0; height: 1px; background: #26334d; margin: 40px 0;">

# 8. Limitations & Future Development

### System Limitations
* **Local Cache Sync:** Data displayed represents the latest background sync snapshot; changes made directly in Jira will reflect after the next scheduled or manual refresh.
* **Single-User Local Focus:** Designed for individual or local machine deployment rather than multi-tenant enterprise server environments.

### Future Roadmap
* Webhook support for real-time Jira event updates.
* Export capabilities (CSV/PDF reporting).
* Customizable alert thresholds and notifications.

---

<hr style="border: 0; height: 1px; background: #26334d; margin: 40px 0;">

# 9. Author & Project Philosophy

* **Creator:** Dewan Dinata
* **Role:** System Analyst

### Development Philosophy
PortalPulse was engineered with a focus on simplicity, speed, and precision. As a system analyst, I built this tool to eliminate the friction of multi-portal monitoring—ensuring that technical workflows remain transparent, self-hosted, and completely under the user's control without unnecessary bloat or corporate software overhead.
