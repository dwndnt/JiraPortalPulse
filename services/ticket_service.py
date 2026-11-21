from datetime import datetime, timezone
from connectors.jira_client import JiraClient
from config import PORTALS, JQLS
from services.db import save_snapshot, load_snapshot

def normalize(portal_code, portal_name, query_name, issue):
    f=issue.get("fields",{})
    assignee=f.get("assignee") or {}; reporter=f.get("reporter") or {}
    status=f.get("status") or {}; priority=f.get("priority") or {}; project=f.get("project") or {}
    key=issue.get("key","")
    return {"id":f"{portal_code}:{key}","portal":portal_code,"portal_name":portal_name,
      "query":query_name,"key":key,"url":f"{PORTALS[portal_code]['url']}/browse/{key}",
      "summary":f.get("summary") or "","status":status.get("name",""),
      "status_category":(status.get("statusCategory") or {}).get("name",""),
      "assignee":assignee.get("displayName","Unassigned"),"assignee_account_id":assignee.get("accountId",""),
      "reporter":reporter.get("displayName",""),"priority":priority.get("name",""),
      "issue_type":(f.get("issuetype") or {}).get("name",""),"project":project.get("key",""),
      "created":f.get("created"),"updated":f.get("updated"),"due_date":f.get("duedate"),
      "resolution":(f.get("resolution") or {}).get("name","")}

def refresh_all():
    collected,errors,query_counts=[],[],{}
    for code,portal in PORTALS.items():
        queries = JQLS.get(code, {})
        if not queries:
            continue
        client=JiraClient(portal["url"])
        for qname,jql in queries.items():
            try:
                issues=client.search_jql(jql)
                query_counts[f"{code} / {qname}"]=len(issues)
                collected.extend(normalize(code,portal["name"],qname,x) for x in issues)
            except Exception as exc:
                errors.append({"portal":code,"query":qname,"error":str(exc)})
    unique={}
    for t in collected:
        k=t["id"]
        if k not in unique:
            unique[k]=t; unique[k]["matched_queries"]=[t["query"]]
        elif t["query"] not in unique[k]["matched_queries"]:
            unique[k]["matched_queries"].append(t["query"])
    tickets=list(unique.values())
    refreshed=datetime.now(timezone.utc).isoformat()
    save_snapshot(tickets,refreshed,errors,query_counts)
    return {"refreshed_at":refreshed,"ticket_count":len(tickets),"query_counts":query_counts,"errors":errors}

def get_dashboard_data():
    data=load_snapshot(); tickets=data.get("tickets",[])
    active=[t for t in tickets if t.get("status_category","").lower()!="done"]
    return {**data,"summary":{"total":len(tickets),"open":len(active),
      "site_a":sum(t["portal"]=="SITE_A" for t in tickets),
      "site_b":sum(t["portal"]=="SITE_B" for t in tickets),
      "site_c":sum(t["portal"]=="SITE_C" for t in tickets)}}


def get_additional_dashboard_data(site="ALL"):
    data = load_snapshot()
    tickets = data.get("tickets", [])

    additional_tickets = [
        t for t in tickets
        if any(
            "additional requests" in q.lower()
            for q in t.get("matched_queries", [t.get("query", "")])
        )
    ]

    site_a_tickets = [
        t for t in additional_tickets
        if t.get("portal") == "SITE_A"
    ]
    site_b_tickets = [
        t for t in additional_tickets
        if t.get("portal") == "SITE_B"
    ]
    site_c_tickets = [
        t for t in additional_tickets
        if t.get("portal") == "SITE_C"
    ]

    if site == "SITE_A":
        result = site_a_tickets
    elif site == "SITE_B":
        result = site_b_tickets
    elif site == "SITE_C":
        result = site_c_tickets
    else:
        result = {
            "SITE_A": site_a_tickets,
            "SITE_B": site_b_tickets,
            "SITE_C": site_c_tickets,
        }

    return {
        "status": "success",
        "data": result
    }