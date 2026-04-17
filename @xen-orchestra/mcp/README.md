<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @xen-orchestra/mcp

[![Package Version](https://badgen.net/npm/v/@xen-orchestra/mcp)](https://npmjs.org/package/@xen-orchestra/mcp) ![License](https://badgen.net/npm/license/@xen-orchestra/mcp) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@xen-orchestra/mcp)](https://bundlephobia.com/result?p=@xen-orchestra/mcp) [![Node compatibility](https://badgen.net/npm/node/@xen-orchestra/mcp)](https://npmjs.org/package/@xen-orchestra/mcp)

> MCP server for Xen Orchestra — allows AI assistants to query and manage XO infrastructure

## Install

Installation of the [npm package](https://npmjs.org/package/@xen-orchestra/mcp):

```sh
npm install --global @xen-orchestra/mcp
```

## Usage

[MCP](https://modelcontextprotocol.io/) (Model Context Protocol) is an open standard that lets AI assistants interact with external tools. This package provides an MCP server that connects AI assistants like Claude to your [Xen Orchestra](https://xen-orchestra.com/) infrastructure, allowing natural language queries about your pools, hosts, and VMs.

### Quick Start

**Claude Desktop** — Add to your config (`~/.config/claude-desktop/config.json`):

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

**Claude Code:**

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

### Multiple XO instances

To connect several XO servers at once, add one entry per instance with a different name (e.g., `xo-production`, `xo-staging`). Each entry runs its own process with its own credentials.

See the [full documentation](https://docs.xen-orchestra.com/mcp) for configuration examples.

### Prerequisites

- **Node.js** >= 20
- **Xen Orchestra** instance with [REST API](https://docs.xen-orchestra.com/restapi) enabled
- An **AI assistant** that supports MCP (Claude Desktop, Claude Code, etc.)

### Configuration

Two authentication modes are supported: **token** (recommended) or **username/password**.

| Variable                | Required                | Description                                                                                   |
| ----------------------- | ----------------------- | --------------------------------------------------------------------------------------------- |
| `XO_URL`                | Yes                     | Xen Orchestra server URL (e.g., `https://xo.example.com`)                                     |
| `XO_TOKEN`              | If no username/password | Authentication token                                                                          |
| `XO_USERNAME`           | If no token             | XO user with admin privileges                                                                 |
| `XO_PASSWORD`           | If no token             | XO password                                                                                   |
| `XO_MCP_ENABLE_ACTIONS` | No                      | Set to `1` to expose write/destructive operations (see [Write operations](#write-operations)) |

To generate a token, go to the XO user page (`/user`) or run `xo-cli create-token`. If both `XO_TOKEN` and `XO_USERNAME`/`XO_PASSWORD` are set, token authentication takes priority.

### Available Tools

At startup, the server fetches the OpenAPI spec from your XO instance (`/rest/v0/docs/swagger.json`) and generates one tool per resource domain. Each domain tool takes an `operation` enum plus optional `id`/`filter`/`fields`/`limit` arguments, so the exact list of operations reflects the XO version you connect to.

**Utility tools** (always present):

| Tool                         | Description                                                                 |
| ---------------------------- | --------------------------------------------------------------------------- |
| `check_connection`           | Test the connection to the Xen Orchestra server                             |
| `search_documentation`       | Search and retrieve Xen Orchestra documentation                             |
| `get_infrastructure_summary` | Aggregate pools/hosts/VMs across the infrastructure into a markdown summary |

**Domain query tools** (generated, read-only):

| Tool                | Typical operations                                                     |
| ------------------- | ---------------------------------------------------------------------- |
| `pools_query`       | `list`, `get`, `dashboard`, `alarms`, `missing_patches`, `messages`, … |
| `hosts_query`       | `list`, `get`, `alarms`, `smt`, `missing_patches`, `messages`, …       |
| `vms_query`         | `list`, `get`, `alarms`, `vdis`, `backup-jobs`, `dashboard`, …         |
| `storage_query`     | `list_vdis`, `get_vdi`, `list_srs`, `get_sr`, `list_vbds`, …           |
| `networks_query`    | `list`, `get`, `list_vifs`, `get_vif`, `list_pifs`, `get_pif`, …       |
| `backup_query`      | `list_schedules`, `list_backup-logs`, `list_backup-repositories`, …    |
| `backup-jobs_query` | `list`, `get`, `jobs_vm_backup`, `jobs_metadata_backup`, …             |
| `admin_query`       | `list_users`, `get_user`, `list_groups`, `list_servers`, …             |
| `infra_query`       | `list_tasks`, `list_messages`, `list_alarms`, `list_events`, …         |
| `system_query`      | `list_pcis`, `list_pgpus`, `list_proxies`, `list_sms`, …               |
| `docs_query`        | `swagger.json`                                                         |
| `xoa_query`         | `list_dashboard`, `list_ping`, `list_gui-routes`                       |

Stats endpoints (`/…/stats`) are deliberately not exposed — the time-series payloads would exceed the LLM context window. Query them via the REST API directly when needed.

### Write operations

Action tools (create/update/delete) are gated behind `XO_MCP_ENABLE_ACTIONS=1` so the default surface stays read-only. When enabled, each domain gets a companion `{domain}_action` tool. Destructive operations (`DELETE *`, `pools/emergency_shutdown`, `vms/hard_shutdown`, …) return a preview and a one-shot `confirm_token` — the assistant must call back with that token within 5 minutes to execute.

Full documentation with tool parameters, examples, and troubleshooting: [docs.xen-orchestra.com/mcp](https://docs.xen-orchestra.com/mcp)

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

[AGPL-3.0-or-later](https://spdx.org/licenses/AGPL-3.0-or-later) © [Vates SAS](https://vates.fr)
