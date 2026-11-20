let allTickets = [],
    chart,
    statusChart,
    assigneeSiteAChart,
    assigneeSiteBChart,
    assigneeSiteCChart;

const $ = id => document.getElementById(id);

document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
    setInterval(loadDashboard, 30000);

    // Navigasi Menu Sidebar & Transisi Mulus (Smooth Transition)
    const navItems = document.querySelectorAll('.sidebar .nav');
    const pageMeta = {
        "main-dashboard": {
            title: "Overview",
            subtitle: "One view for every Jira portal"
        },
        "additional-dashboard": {
            title: "Additional Requests",
            subtitle: "Configured secondary issue tracking"
        }
    };

    navItems.forEach(nav => {
        nav.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            nav.classList.add('active');

            const targetId = nav.getAttribute('data-target');
            
            // Update Judul & Subjudul Header secara dinamis
            if (pageMeta[targetId]) {
                $("page-title").textContent = pageMeta[targetId].title;
                $("page-subtitle").textContent = pageMeta[targetId].subtitle;
            }

            // Tampilkan section dengan kelas transisi halus (active-section)
            document.querySelectorAll('.dashboard-section').forEach(sec => {
                if (sec.id === targetId) {
                    sec.classList.add('active-section');
                } else {
                    sec.classList.remove('active-section');
                }
            });

            if (targetId === 'additional-dashboard') {
                loadAdditionalData('ALL');
            }
        });
    });

    const siteButtons = document.querySelectorAll('.filter-site-btn');
    siteButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            siteButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const site = e.target.getAttribute('data-site');
            loadAdditionalData(site);
        });
    });

    $("siteFilter").addEventListener("change", renderTickets);
    $("statusFilter").addEventListener("change", renderTickets);
    $("search").addEventListener("input", renderTickets);

    $("refreshBtn").addEventListener("click", async () => {
        $("refreshBtn").disabled = true;
        $("refreshBtn").textContent = "Refreshing…";
        try {
            let r = await fetch("/api/refresh", {
                method: "POST"
            });
            if (!r.ok) throw Error(await r.text());
            await loadDashboard();
        } catch (e) {
            alert("Refresh failed: " + e.message);
        } finally {
            $("refreshBtn").disabled = false;
            $("refreshBtn").textContent = "↻ Refresh now";
        }
    });
});

async function loadDashboard() {
    try {
        const r = await fetch("/api/dashboard");
        if (!r.ok) throw Error(await r.text());
        const d = await r.json();
        allTickets = d.tickets || [];

        $("total").textContent = d.summary?.total ?? allTickets.length;
        $("open").textContent = d.summary?.open ?? "—";
        $("siteA").textContent = d.summary?.site_a ?? "—";
        $("siteB").textContent = d.summary?.site_b ?? "—";
        $("siteC").textContent = d.summary?.site_c ?? "—";
        $("refresh-label").textContent = d.refreshed_at ? "Last refresh " + new Date(d.refreshed_at).toLocaleString() : "No successful refresh yet";
        $("ticketSub").textContent = `${allTickets.length} unique issues · combined from configured JQLs`;

        populateStatuses();
        drawChart(d.summary || {});
        drawStatusChart();
        drawSiteAssigneeChart("SITE_A", "assigneeSiteAChart", assigneeSiteAChart, chart => assigneeSiteAChart = chart);
        drawSiteAssigneeChart("SITE_B", "assigneeSiteBChart", assigneeSiteBChart, chart => assigneeSiteBChart = chart);
        drawSiteAssigneeChart("SITE_C", "assigneeSiteCChart", assigneeSiteCChart, chart => assigneeSiteCChart = chart);
        renderTickets();
        renderErrors(d.errors || []);
    } catch (e) {
        $("refresh-label").textContent = "Backend unavailable";
        console.error(e);
    }
}

function populateStatuses() {
    const s = $("statusFilter"),
        old = s.value,
        vals = [...new Set(allTickets.map(t => t.status).filter(Boolean))].sort();
    s.innerHTML = '<option value="">All statuses</option>' + vals.map(x => `<option>${esc(x)}</option>`).join("");
    s.value = old;
}

// --- Grafik 1: Ticket Distribution ---
function drawChart(s) {
    if (chart) chart.destroy();
    chart = new Chart($("portalChart"), {
        type: "bar",
        data: {
            labels: ["Site A", "Site B", "Site C"],
            datasets: [{
                label: "Tickets",
                data: [s.site_a || 0, s.site_b || 0, s.site_c || 0],
                backgroundColor: ["#6098ff", "#a78bfa", "#40c99a"],
                borderRadius: 7,
                maxBarThickness: 55
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: "#91a0bb"
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: "#26334d"
                    },
                    ticks: {
                        color: "#91a0bb",
                        precision: 0
                    }
                }
            }
        }
    });
}

// --- Grafik 2: Status Distribution per Site (Stacked Bar) ---
function drawStatusChart() {
    if (statusChart) statusChart.destroy();

    const sites = ["SITE_A", "SITE_B", "SITE_C"];
    const siteLabels = ["Site A", "Site B", "Site C"];
    const statuses = [...new Set(allTickets.map(t => t.status).filter(Boolean))].sort();

    const colorPalette = [
        "#6098ff", "#40c99a", "#a78bfa", "#fbbf24",
        "#f87171", "#38bdf8", "#fb923c", "#e879f9", "#94a3b8"
    ];

    const datasets = statuses.map((status, idx) => {
        const bgColor = colorPalette[idx % colorPalette.length];
        return {
            label: status,
            data: sites.map(site => allTickets.filter(ticket => ticket.portal === site && ticket.status === status).length),
            backgroundColor: bgColor,
            borderRadius: 4,
            maxBarThickness: 55
        };
    });

    statusChart = new Chart($("statusChart"), {
        type: "bar",
        data: {
            labels: siteLabels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: "bottom",
                    labels: {
                        color: "#91a0bb",
                        boxWidth: 11,
                        padding: 12,
                        font: {
                            size: 10
                        }
                    }
                },
                tooltip: {
                    mode: "index",
                    intersect: false
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: "#91a0bb"
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    grid: {
                        color: "#26334d"
                    },
                    ticks: {
                        color: "#91a0bb",
                        precision: 0
                    }
                }
            }
        }
    });
}

// --- Assignee Distribution per Site ---
function drawSiteAssigneeChart(siteCode, canvasId, chartInstance, setChartInstance) {
    if (chartInstance) chartInstance.destroy();

    const siteTickets = allTickets.filter(ticket => ticket.portal === siteCode);
    const assigneeCounts = {};

    siteTickets.forEach(ticket => {
        const assignee = ticket.assignee && ticket.assignee.trim() !== "" ? ticket.assignee : "Unassigned";
        assigneeCounts[assignee] = (assigneeCounts[assignee] || 0) + 1;
    });

    const sortedAssignees = Object.entries(assigneeCounts).sort((a, b) => b[1] - a[1]);
    let topAssignees = sortedAssignees.slice(0, 4);
    const others = sortedAssignees.slice(4);

    if (others.length > 0) {
        const othersCount = others.reduce((sum, item) => sum + item[1], 0);
        topAssignees.push(["Others", othersCount]);
    }

    const labels = topAssignees.map(item => item[0]);
    const dataValues = topAssignees.map(item => item[1]);
    const totalSiteTickets = siteTickets.length;

    const colorPalette = ["#6098ff", "#40c99a", "#a78bfa", "#fbbf24", "#f87171", "#94a3b8"];

    const newChart = new Chart($(canvasId), {
        type: "doughnut",
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: colorPalette.slice(0, labels.length),
                borderWidth: 2,
                borderColor: "#121a2d"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: "bottom",
                    labels: {
                        color: "#91a0bb",
                        boxWidth: 9,
                        padding: 8,
                        font: {
                            size: 9
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const percentage = totalSiteTickets > 0 ? ((value / totalSiteTickets) * 100).toFixed(1) : 0;
                            return ` ${label}: ${value} tickets (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: "55%"
        }
    });

    setChartInstance(newChart);
}

// --- Render Tabel General Dashboard ---
function renderTickets() {
    const p = $("siteFilter").value,
        s = $("statusFilter").value,
        q = $("search").value.toLowerCase(),
        rows = allTickets.filter(t => (!p || t.portal === p) && (!s || t.status === s) && (!q || [t.key, t.summary, t.assignee, t.reporter, t.portal].join(" ").toLowerCase().includes(q)));

    $("tickets").innerHTML = rows.slice(0, 1000).map(t => `
        <tr>
            <td><a class="issue-link" href="${esc(t.url)}" target="_blank" rel="noopener">${esc(t.key)}</a></td>
            <td><span class="portal-pill">${esc(t.portal)}</span></td>
            <td>${esc(t.summary)}</td>
            <td><span class="status-pill">${esc(t.status)}</span></td>
            <td>${esc(t.assignee)}</td>
            <td>${esc(t.priority || "—")}</td>
            <td>${date(t.due_date)}</td>
            <td>${date(t.updated)}</td>
        </tr>
    `).join("");

    $("shown").textContent = `Showing ${Math.min(rows.length, 1000)} of ${rows.length} tickets`;
}

function renderErrors(es) {
    $("errorsPanel").hidden = !es.length;
    $("errors").innerHTML = es.map(e => `<p><b>${esc(e.portal)} / ${esc(e.query)}</b>: ${esc(e.error)}</p>`).join("");
}

function date(v) {
    return v ? new Date(v).toLocaleDateString() : "—";
}

function esc(v) {
    return String(v ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    } [c]));
}

async function loadAdditionalData(site) {
    try {
        const response = await fetch(`/api/additional-dashboard?site=${site}`);
        const result = await response.json();
        if (result.status === 'success') {
            renderAdditionalTable(result.data, site);
        }
    } catch (error) {
        console.error('Failed to load additional dashboard data:', error);
    }
}

function renderAdditionalTable(data, activeSite) {
    const tbody = document.getElementById('additional-table-body');
    tbody.innerHTML = '';
    let additionalTickets = [];

    if (activeSite === 'ALL') {
        ['SITE_A', 'SITE_B', 'SITE_C'].forEach(site => {
            if (data[site]) {
                data[site].forEach(ticket => ticket.siteTag = site);
                additionalTickets = additionalTickets.concat(data[site] || []);
            }
        });
    } else {
        additionalTickets = (data || []).map(ticket => {
            ticket.siteTag = activeSite;
            return ticket;
        });
    }

    document.getElementById('additional-total-count').innerText = additionalTickets.length;
    if (activeSite === 'ALL') {
        document.getElementById('additional-site-a-count').innerText = (data['SITE_A'] || []).length;
        document.getElementById('additional-site-b-count').innerText = (data['SITE_B'] || []).length;
        document.getElementById('additional-site-c-count').innerText = (data['SITE_C'] || []).length;
    }

    additionalTickets.forEach(ticket => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="badge badge-${ticket.siteTag.toLowerCase().replace('_', '-')}">${esc(ticket.siteTag)}</span></td>
            <td><a class="issue-link" href="${esc(ticket.url)}" target="_blank" rel="noopener">${esc(ticket.key)}</a></td>
            <td>${esc(ticket.summary)}</td>
            <td>${esc(ticket.status)}</td>
            <td>${esc(ticket.assignee || 'Unassigned')}</td>
            <td>${date(ticket.created)}</td>
        `;
        tbody.appendChild(tr);
    });
}