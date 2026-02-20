# @xen-orchestra/mcp

[MCP](https://modelcontextprotocol.io/) (Model Context Protocol) server for [Xen Orchestra](https://xen-orchestra.com/). Enables AI assistants to query your XO infrastructure.

## Features

- **Infrastructure queries** — List and inspect pools, hosts, and VMs
- **Dashboard** — Aggregated pool statistics (host status, top consumers, alarms)
- **Documentation** — Search XO docs directly from the assistant
- **Read-only** — Safe by design, no destructive operations

## Quick Start

### Claude Desktop

Add to your Claude Desktop config (`~/.config/claude-desktop/config.json`):

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

### Claude Code

```bash
claude mcp add xo -- env XO_URL=https://your-xo-server XO_USERNAME=admin@example.com XO_PASSWORD=secret npx @xen-orchestra/mcp
```

### Any MCP Client

```bash
XO_URL=https://your-xo-server XO_USERNAME=admin XO_PASSWORD=secret npx @xen-orchestra/mcp
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `XO_URL` | Yes | Xen Orchestra server URL |
| `XO_USERNAME` | Yes | XO username |
| `XO_PASSWORD` | Yes | XO password |

## Available Tools

### `check_connection`

Test the connection to the XO server.

### `list_pools`

List all pools with optional field selection.

| Parameter | Type | Description |
|-----------|------|-------------|
| `fields` | string? | Comma-separated fields to return |

### `get_pool_dashboard`

Get aggregated dashboard for a pool (host status, top consumers, alarms).

| Parameter | Type | Description |
|-----------|------|-------------|
| `pool_id` | string | The pool ID |

### `list_hosts`

List all hosts (hypervisors) with optional filtering.

| Parameter | Type | Description |
|-----------|------|-------------|
| `filter` | string? | Filter expression (e.g., `productBrand:XCP-ng`) |
| `fields` | string? | Comma-separated fields to return |

### `list_vms`

List virtual machines with optional filtering and pagination.

| Parameter | Type | Description |
|-----------|------|-------------|
| `filter` | string? | Filter expression (e.g., `power_state:Running`) |
| `fields` | string? | Comma-separated fields to return |
| `limit` | number? | Maximum number of results |

### `get_vm_details`

Get full details about a specific VM.

| Parameter | Type | Description |
|-----------|------|-------------|
| `vm_id` | string | The VM ID or UUID |

### `get_infrastructure_summary`

Get a high-level summary of the entire infrastructure (pool count, host count, VM counts by state).

### `search_documentation`

Retrieve XO documentation by topic.

| Parameter | Type | Description |
|-----------|------|-------------|
| `topic` | enum | One of: `installation`, `configuration`, `backups`, `restapi`, `manage`, `users`, `architecture`, `troubleshooting`, `releases` |

## Development

```bash
npm install
npm run build
npm test

# Run locally
XO_URL=https://your-xo XO_USERNAME=admin XO_PASSWORD=secret npm start
```

## License

AGPL-3.0-or-later
