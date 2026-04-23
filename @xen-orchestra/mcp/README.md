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

At startup, the server fetches the OpenAPI spec from your XO instance (`/rest/v0/docs/swagger.json`) and generates one tool per resource domain. Domain and operation names come straight from the spec: the primary tag (`tags[0]`) becomes `{tag}_query`, and each `operationId` (e.g. `GetVms`, `StartVm`, `HardShutdownVm`) is used verbatim as the enum value. No hand-curated mapping — if the XO server adds a new endpoint, it appears automatically. Responses are rendered as markdown tables by the REST API itself (via `?markdown=true`); the MCP layer only relays them.

**Utility tools** (always present):

| Tool                         | Description                                                                 |
| ---------------------------- | --------------------------------------------------------------------------- |
| `check_connection`           | Test the connection to the Xen Orchestra server                             |
| `search_documentation`       | Search and retrieve Xen Orchestra documentation                             |
| `get_infrastructure_summary` | Aggregate pools/hosts/VMs across the infrastructure into a markdown summary |

**Domain query tools** (generated, read-only). Each tool accepts an `operation` enum (the OpenAPI `operationId`) plus optional `id`, `filter`, `fields`, `limit`. On a current xo-server the generated domains are:

- Compute: `pools_query`, `hosts_query`, `vms_query` (covers VMs, templates, snapshots, controllers — tsoa groups them under the `vms` tag server-side)
- Storage: `vdis_query` (includes VDI snapshots), `srs_query`, `vbds_query`, `pbds_query`
- Network: `networks_query`, `vifs_query`, `pifs_query`
- Backup: `backup_jobs_query`, `backup_logs_query`, `restore_logs_query`, `backup_repositories_query`, `backup_archives_query`, `schedules_query`
- Access: `users_query`, `groups_query`, `servers_query`
- Observability: `alarms_query`, `messages_query`, `events_query`, `tasks_query`
- System: `proxies_query`, `pgpus_query`, `pcis_query`, `sms_query`, `xoa_query`
- Misc: `docs_query`

Stats endpoints (`/…/stats`) and binary download endpoints (`.xva`, `.ova`, `.vhd`, `.raw`, …) are deliberately not exposed — the payloads are unsuitable for LLM context. Query them via the REST API directly when needed.

### Configuration

| Env var                 | Effect                                                                                   |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| `XO_MCP_ENABLE_ACTIONS` | Set to `1` to expose write operations (`{domain}_action` tools). Default: read-only.     |
| `XO_MCP_DENY_LIST`      | Comma-separated list of `operationId`s to drop entirely, e.g. `DeleteVm,HardShutdownVm`. |

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
