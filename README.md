# PortalPulse

**One dashboard for monitoring multiple Jira sites.**

PortalPulse collects issues from multiple Jira Cloud sites, combines the
results, and presents ticket and status summaries in one local dashboard.

## English

### Features

- Connect up to three Jira sites with separate query settings.
- Browse consolidated tickets and site-level summaries.
- Group issues using an additional query category.
- Avoid duplicate tickets and handle paginated search results.
- Refresh data on a schedule or on demand.
- Keep credentials and private configuration on your local machine.

### Requirements

- Python 3.10 or later
- Jira Cloud access and an Atlassian API token
- Windows to use `run_windows.bat`

### Setup

1. Copy `.env.example` to `.env`.
2. Set your credentials and site connection/query settings in `.env`. Use only
   information for sites you are authorized to access.
3. Start the app:

   **Windows**

   ```text
   run_windows.bat
   ```

   **Other operating systems**

   ```bash
   python -m venv .venv
   # Activate the virtual environment for your shell.
   python -m pip install -r requirements.txt
   python app.py
   ```

4. Open `127.0.0.1:8000` in your browser.

By default, the app accepts local connections only. Do not expose it to a
public network without adding authentication and access controls.

### Configuration

Configuration is loaded from `.env`, not from source code.

| Variable | Purpose |
|---|---|
| `APP_HOST` | App bind address; defaults to `127.0.0.1` |
| `APP_PORT` | App port; defaults to `8000` |
| `REFRESH_MINUTES` | Automatic refresh interval; defaults to `15` |
| `ATLASSIAN_EMAIL` | Atlassian account email |
| `ATLASSIAN_API_TOKEN` | Atlassian API token |
| `JIRA_SITE_<A-C>_JQL` | Main query for a site |
| `JIRA_SITE_<A-C>_SECONDARY_JQL` | Additional query for a site |

Use the placeholders in `.env.example` as a starting point and replace them
with values that match your own Jira configuration.

### API

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/` | PortalPulse dashboard |
| `GET` | `/api/health` | Application health check |
| `GET` | `/api/dashboard` | Cached consolidated dashboard data |
| `GET` | `/api/additional-dashboard?site=ALL` | Cached additional-query results |
| `POST` | `/api/refresh` | Start a manual data refresh |

### Security

- `.env` is excluded by Git. Never commit credentials or private Jira queries.
- The local cache may contain issue summaries and account information; do not
  share it.
- Keep private connection settings, custom field identifiers, and production
  queries out of public source files.
- If a token was published, revoke it and create a replacement.
- Confirm that you have the right to publish this code before choosing a license.

---

## 简体中文

### 功能

- 连接最多三个 Jira 站点，并为每个站点单独配置查询。
- 在一个页面中查看汇总后的工单和站点统计。
- 使用额外查询类别对工单进行分组。
- 避免重复工单，并支持分页获取搜索结果。
- 按计划或手动刷新数据。
- 将凭据和私有配置保留在本地计算机。

### 环境要求

- Python 3.10 或更高版本
- Jira Cloud 访问权限和 Atlassian API 令牌
- 使用 `run_windows.bat` 需要 Windows

### 安装与启动

1. 将 `.env.example` 复制为 `.env`。
2. 在 `.env` 中填写凭据、站点连接设置和查询。仅使用你有权访问的站点信息。
3. 启动应用：

   **Windows**

   ```text
   run_windows.bat
   ```

   **其他操作系统**

   ```bash
   python -m venv .venv
   # 根据所用命令行启用虚拟环境。
   python -m pip install -r requirements.txt
   python app.py
   ```

4. 在浏览器中打开 `127.0.0.1:8000`。

应用默认只接受本机连接。若要开放到公共网络，请先配置身份验证和访问控制。

### 配置

应用从 `.env` 读取配置，不从源代码读取。

| 变量 | 用途 |
|---|---|
| `APP_HOST` | 应用监听地址；默认值为 `127.0.0.1` |
| `APP_PORT` | 应用端口；默认值为 `8000` |
| `REFRESH_MINUTES` | 自动刷新间隔；默认值为 `15` |
| `ATLASSIAN_EMAIL` | Atlassian 账户邮箱 |
| `ATLASSIAN_API_TOKEN` | Atlassian API 令牌 |
| `JIRA_SITE_<A-C>_JQL` | 每个站点的主要查询 |
| `JIRA_SITE_<A-C>_SECONDARY_JQL` | 每个站点的附加查询 |

请以 `.env.example` 中的占位内容为模板，并替换为适用于你自己的 Jira 配置。

### API

| 方法 | 路径 | 用途 |
|---|---|---|
| `GET` | `/` | PortalPulse 仪表板 |
| `GET` | `/api/health` | 检查应用状态 |
| `GET` | `/api/dashboard` | 获取缓存的汇总数据 |
| `GET` | `/api/additional-dashboard?site=ALL` | 获取缓存的附加查询结果 |
| `POST` | `/api/refresh` | 手动开始刷新数据 |

### 安全

- `.env` 已通过 Git 忽略。不要提交凭据或私有 Jira 查询。
- 本地缓存可能包含工单摘要和账户信息，请勿分享。
- 不要将私有连接设置、自定义字段标识符或生产查询放入公开源文件。
- 如果令牌曾被公开，请立即撤销并创建新令牌。
- 发布代码前，请确认你有权公开这些代码并选择相应许可证。
