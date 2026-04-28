# Model Context Protocol (MCP)

## What is MCP?

[MCP](https://modelcontextprotocol.io/) (Model Context Protocol) is an open standard that allows AI assistants to interact with external tools and data sources. Think of it as a universal adapter between AI assistants (like Claude) and your infrastructure.

With the `@xen-orchestra/mcp` package, your AI assistant can directly query your Xen Orchestra instance to answer questions about your virtualization infrastructure in natural language.

## Why MCP with Xen Orchestra?

MCP enables new ways to interact with your infrastructure:

- **Natural language queries** — Ask "How many VMs are running?" instead of navigating dashboards
- **AI-assisted monitoring** — Get instant summaries of your infrastructure state
- **Quick diagnostics** — Ask about specific VMs, hosts, or pools without leaving your conversation
- **Documentation at your fingertips** — Search XO documentation directly from the assistant

All operations are **read-only by default**, ensuring safe interaction with your production environment. Write operations can be enabled explicitly — see [Write operations](#write-operations).

## Installation

### Prerequisites

- **Node.js** 20 or later
- A **Xen Orchestra** instance with [REST API](restapi.md) enabled
- An **AI assistant** that supports MCP (Claude Desktop, Claude Code, etc.)

### Install the MCP server

```bash
npm install -g @xen-orchestra/mcp
```

Or run directly without installing:

```bash
npx @xen-orchestra/mcp
```

### Configure authentication

The MCP server connects to Xen Orchestra via the REST API. Two authentication modes are supported: **token** (recommended) or **username/password**.

| Variable                | Required                | Description                                                                                   |
| ----------------------- | ----------------------- | --------------------------------------------------------------------------------------------- |
| `XO_URL`                | Yes                     | Xen Orchestra server URL (e.g., `https://xo.example.com`)                                     |
| `XO_TOKEN`              | If no username/password | Authentication token                                                                          |
| `XO_USERNAME`           | If no token             | XO user with admin privileges                                                                 |
| `XO_PASSWORD`           | If no token             | XO password                                                                                   |
| `XO_MCP_ENABLE_ACTIONS` | No                      | Set to `1` to expose write/destructive operations (see [Write operations](#write-operations)) |

To generate a token, go to the XO user page (`/user`) or run `xo-cli create-token`. If both `XO_TOKEN` and `XO_USERNAME`/`XO_PASSWORD` are set, token authentication takes priority.

:::tip
Only admin users can currently use the REST API. See [REST API authentication](restapi.md#authentication) for details.
:::

### Configure your AI assistant

#### Claude Desktop

Add the following to your Claude Desktop configuration file (`~/.config/claude-desktop/config.json` on Linux, `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

Using a token (recommended):

```json
{
  "mcpServers": {
    "xo": {
      "command": "npx",
      "args": ["@xen-orchestra/mcp"],
      "env": {
        "XO_URL": "https://your-xo-server",
        "XO_TOKEN": "your-token"
      }
    }
  }
}
```

Using username/password:

```json
{
  "mcpServers": {
    "xo": {
      "command": "npx",
      "args": ["@xen-orchestra/mcp"],
      "env": {
        "XO_URL": "https://your-xo-server",
        "XO_USERNAME": "admin@example.com",
        "XO_PASSWORD": "your-password"
      }
    }
  }
}
```

#### Claude Code

```bash
# Using a token (recommended)
claude mcp add xo \
  -e XO_URL=https://your-xo-server \
  -e XO_TOKEN=your-token \
  -- npx @xen-orchestra/mcp

# Using username/password
claude mcp add xo \
  -e XO_URL=https://your-xo-server \
  -e XO_USERNAME=admin@example.com \
  -e XO_PASSWORD=your-password \
  -- npx @xen-orchestra/mcp
```

#### Other MCP-compatible clients

Run the MCP server with environment variables set:

```bash
# Using a token (recommended)
XO_URL=https://your-xo-server \
XO_TOKEN=your-token \
npx @xen-orchestra/mcp

# Using username/password
XO_URL=https://your-xo-server \
XO_USERNAME=admin@example.com \
XO_PASSWORD=your-password \
npx @xen-orchestra/mcp
```

The server communicates via stdio using the MCP protocol (JSON-RPC), compatible with any MCP client.

#### Multiple XO instances

To manage several XO servers from the same assistant, add one entry per instance with a different name:

```json
{
  "mcpServers": {
    "xo-production": {
      "command": "npx",
      "args": ["@xen-orchestra/mcp"],
      "env": {
        "XO_URL": "https://xo-production.example.com",
        "XO_TOKEN": "prod-token"
      }
    },
    "xo-staging": {
      "command": "npx",
      "args": ["@xen-orchestra/mcp"],
      "env": {
        "XO_URL": "https://xo-staging.example.com",
        "XO_TOKEN": "staging-token"
      }
    }
  }
}
```

With Claude Code:

```bash
claude mcp add xo-production \
  -e XO_URL=https://xo-production.example.com \
  -e XO_TOKEN=prod-token \
  -- npx @xen-orchestra/mcp

claude mcp add xo-staging \
  -e XO_URL=https://xo-staging.example.com \
  -e XO_TOKEN=staging-token \
  -- npx @xen-orchestra/mcp
```

Each entry starts its own process with its own credentials. The assistant gets a separate set of tools per instance, so you can ask about a specific environment by name ("list running VMs on xo-production").

:::tip
Pick descriptive names (`xo-production`, `xo-dr-site`, ...) so the assistant knows which instance you're referring to.
:::

## How it works

![MCP architecture workflow](./assets/mcp_workflow.png)

1. On startup, the MCP server fetches the OpenAPI spec from your XO instance (`/rest/v0/docs/swagger.json`) and generates one tool per resource domain.
2. You ask a question in natural language to your AI assistant.
3. The assistant picks a tool (e.g. `pools_query`) and chooses an `operation` (e.g. `list`, `dashboard`).
4. The MCP server calls the corresponding XO REST endpoint and returns a markdown-formatted response.

Because the tool surface is generated from the live OpenAPI spec, it always reflects the XO version you're connecting to — new endpoints become available automatically as XO evolves.

## Available Tools

### Utility tools

These three tools are always present regardless of the XO spec.

#### `check_connection`

Test the connection to the Xen Orchestra server. Use this to validate your setup before querying infrastructure.

**Parameters:** None

**Example question:** "Can you connect to my XO server?"

---

#### `get_infrastructure_summary`

Aggregate pools, hosts, and VMs across the entire infrastructure into a single markdown summary.

**Parameters:** None

**Example question:** "Give me an overview of my infrastructure"

---

#### `search_documentation`

Search and retrieve Xen Orchestra documentation. Useful for learning about XO features, configuration, and best practices.

| Parameter | Type | Required | Description                                                                                                                     |
| --------- | ---- | -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `topic`   | enum | Yes      | One of: `installation`, `configuration`, `backups`, `restapi`, `manage`, `users`, `architecture`, `troubleshooting`, `releases` |

**Example question:** "How do I configure backups in XO?"

### Domain query tools

Each resource family exposes a single `{domain}_query` tool. Domains come from the spec's primary tag (`tags[0]`) verbatim — no client-side remapping. The MCP layer asks the REST API for a pre-rendered markdown table (`?markdown=true`) and relays the bytes verbatim; there is no client-side formatting.

All query tools share the same argument shape:

| Parameter   | Type   | Required    | Description                                                                                                              |
| ----------- | ------ | ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| `operation` | enum   | Yes         | The OpenAPI `operationId` to invoke. Valid values are listed in the tool description.                                    |
| `id`        | string | If required | Resource ID (required for single-resource and sub-resource operations)                                                   |
| `filter`    | string | No          | [Filter expression](https://docs.xen-orchestra.com/manage_infrastructure#live-filter-search) for list operations         |
| `fields`    | string | No          | Comma-separated fields to return (e.g. `id,name_label`). Passed straight to the REST API; leave empty to get all fields. |
| `limit`     | number | No          | Maximum number of results for list operations                                                                            |

Operation names are the `operationId`s emitted by the server (tsoa, PascalCase). Examples:

| operationId             | Endpoint                                      |
| ----------------------- | --------------------------------------------- |
| `GetPools`              | `GET /pools`                                  |
| `GetPool`               | `GET /pools/{id}`                             |
| `GetPoolDashboard`      | `GET /pools/{id}/dashboard`                   |
| `EmergencyShutdownPool` | `POST /pools/{id}/actions/emergency_shutdown` |
| `StartVm`               | `POST /vms/{id}/actions/start`                |
| `DeleteVm`              | `DELETE /vms/{id}`                            |
| `GetVmAlarms`           | `GET /vms/{id}/alarms`                        |

Generated domains (on a current xo-server):

- Compute: `pools_query`, `hosts_query`, `vms_query` (covers VMs, templates, snapshots, controllers — tsoa groups them under `vms` server-side)
- Storage: `vdis_query` (includes VDI snapshots), `srs_query`, `vbds_query`, `pbds_query`
- Network: `networks_query`, `vifs_query`, `pifs_query`
- Backup: `backup_jobs_query`, `backup_logs_query`, `restore_logs_query`, `backup_repositories_query`, `backup_archives_query`, `schedules_query`
- Access: `users_query`, `groups_query`, `servers_query`
- Observability: `alarms_query`, `messages_query`, `events_query`, `tasks_query`
- System: `proxies_query`, `pgpus_query`, `pcis_query`, `sms_query`, `xoa_query`
- Misc: `docs_query`

**Example questions:**

- "List all my pools" → `pools_query` with `operation: GetPools`
- "Show the dashboard for pool X" → `pools_query` with `operation: GetPoolDashboard, id: X`
- "How many VMs are currently running?" → `vms_query` with `operation: GetVms, filter: power_state:Running`
- "List user VDIs larger than 100GB" → `vdis_query` with `operation: GetVdis, filter: VDI_type:User`
- "Show all XCP-ng hosts" → `hosts_query` with `operation: GetHosts, filter: productBrand:XCP-ng`

**Configuration env vars:**

| Env var                 | Effect                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------ |
| `XO_MCP_ENABLE_ACTIONS` | Set to `1` to expose write operations (`{domain}_action` tools). Default: read-only. |
| `XO_MCP_DENY_LIST`      | Comma-separated `operationId`s to drop entirely, e.g. `DeleteVm,HardShutdownVm`.     |

:::note Excluded endpoints
Stats endpoints (`/…/stats`) and binary downloads (`.xva`, `.ova`, `.raw`, `.vhd`, `.{format}`, …) are deliberately not exposed as MCP tools: their payloads are unsuitable for LLM context. Hit the REST API directly when you need them.
:::

### Write operations

By default, the MCP server only exposes read-only tools. Set `XO_MCP_ENABLE_ACTIONS=1` in the server environment to also expose `{domain}_action` tools covering POST/PUT/PATCH/DELETE operations.

Action tools share this argument shape:

| Parameter       | Type   | Required         | Description                                                                                |
| --------------- | ------ | ---------------- | ------------------------------------------------------------------------------------------ |
| `operation`     | enum   | Yes              | The `operationId` of the action to perform (e.g. `StartVm`, `DeleteVm`, `HardShutdownVm`). |
| `id`            | string | For most actions | Target resource ID                                                                         |
| `body`          | object | No               | Request body for create/update operations                                                  |
| `confirm_token` | string | For risky ops    | One-shot token returned by a prior preview call — required to execute dangerous operations |

**Confirmation flow for dangerous operations.** All `DELETE`s and a hand-picked set of destructive operations (`EmergencyShutdownPool`, `RollingReboot`, `RollingUpdate`, `HardShutdownVm`, `HardRebootVm`) require explicit confirmation. The first call returns a preview and a `confirm_token`; the assistant must call back within 5 minutes with that token to execute. This turns "Yes, delete all my snapshots" into a two-step handshake and neutralises accidental destructive calls. Set `XO_MCP_DENY_LIST` to remove them from the exposed surface entirely when you don't want them offered at all.

:::warning Only enable actions if you trust the caller
Enabling `XO_MCP_ENABLE_ACTIONS` lets the assistant mutate your infrastructure. Confirmations reduce the blast radius for destructive operations, but non-destructive writes (create, update) proceed without a second round-trip. Keep read-only mode unless you have a specific need.
:::

## Prompts

The MCP server also provides a built-in prompt:

### `infrastructure-overview`

Generates a natural language overview of the XO infrastructure. When invoked, the assistant calls `get_infrastructure_summary` and formats the results as a readable summary.

## Example Conversations

**Infrastructure overview:**

![Querying infrastructure with MCP](./assets/mcp_infra.gif)

**Searching documentation:**

![Searching XO documentation with MCP](./assets/mcp_doc.gif)

## Troubleshooting

:::note Connection refused
Verify that `XO_URL` is correct and includes the protocol (`https://` or `http://`). Make sure the XO server is reachable from the machine running the MCP server.
:::

:::note Authentication failed (401)
If using token authentication, check that `XO_TOKEN` is valid — the token may have expired or been revoked. If using username/password, check `XO_USERNAME` and `XO_PASSWORD`. Only admin users can currently access the REST API.
:::

:::note Timeout errors
The MCP server has a 30-second timeout for API requests. If you experience timeouts, check network connectivity between the MCP server and your XO instance.
:::

:::note Missing required environment variables
`XO_URL` is always required. You must also set either `XO_TOKEN` or both `XO_USERNAME` and `XO_PASSWORD`. When using Claude Desktop, make sure they are in the `env` section of the MCP server configuration.
:::
