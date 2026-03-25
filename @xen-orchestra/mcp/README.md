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

### Prerequisites

- **Node.js** >= 20
- **Xen Orchestra** instance with [REST API](https://docs.xen-orchestra.com/restapi) enabled
- An **AI assistant** that supports MCP (Claude Desktop, Claude Code, etc.)

### Configuration

Two authentication modes are supported: **token** (recommended) or **username/password**.

| Variable      | Required                | Description                                               |
| ------------- | ----------------------- | --------------------------------------------------------- |
| `XO_URL`      | Yes                     | Xen Orchestra server URL (e.g., `https://xo.example.com`) |
| `XO_TOKEN`    | If no username/password | Authentication token                                      |
| `XO_USERNAME` | If no token             | XO user with admin privileges                             |
| `XO_PASSWORD` | If no token             | XO password                                               |

To generate a token, go to the XO user page (`/user`) or run `xo-cli create-token`. If both `XO_TOKEN` and `XO_USERNAME`/`XO_PASSWORD` are set, token authentication takes priority.

### Available Tools

| Tool                         | Description                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------- |
| `check_connection`           | Test the connection to the Xen Orchestra server                                       |
| `list_pools`                 | List all pools in Xen Orchestra with their basic information                          |
| `get_pool_dashboard`         | Get aggregated dashboard for a pool including hosts status, top consumers, and alarms |
| `list_hosts`                 | List all hosts (hypervisors) in Xen Orchestra                                         |
| `list_vms`                   | List virtual machines in Xen Orchestra with optional filtering                        |
| `list_vdis`                  | List virtual disks (VDIs) in Xen Orchestra with optional filtering                    |
| `list_srs`                   | List storage repositories (SRs) in Xen Orchestra with optional filtering              |
| `get_sr_details`             | Get detailed information about a specific storage repository                          |
| `get_vm_details`             | Get detailed information about a specific virtual machine                             |
| `list_networks`              | List all networks in Xen Orchestra with optional filtering                            |
| `get_network_details`        | Get detailed information about a specific network                                     |
| `get_infrastructure_summary` | Get a high-level summary of the entire XO infrastructure (pools, hosts, VMs counts)   |
| `search_documentation`       | Search and retrieve Xen Orchestra documentation                                       |

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
