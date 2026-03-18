# xo-server-tag-balancer

> Tag-based VM load balancer plugin for XO Server, with on-demand API and dry-run support.

## Overview

This plugin provides VM load balancing across hosts within a pool, driven by tags placed directly on VMs. Unlike the existing `xo-server-load-balancer` (which uses configured plans and runs on a cron schedule), this plugin:

- Uses **VM tags** (`xo:load:balancer:*`) to declare affinity, anti-affinity, and exclusion rules
- Operates **on-demand** via an API call (no cron)
- Supports **dry-run** mode to preview migrations before executing them

## VM Tags

Tags are set directly on VMs using the standard XO tagging mechanism.

| Tag                                      | Effect                                                                |
| ---------------------------------------- | --------------------------------------------------------------------- |
| `xo:load:balancer:ignore`                | VM is excluded from all load balancing decisions                      |
| `xo:load:balancer:affinity=<group>`      | VM should be placed on the same host as other VMs with the same group |
| `xo:load:balancer:anti-affinity=<group>` | VM should be placed on a different host from VMs with the same group  |

A VM can have multiple tags. Anti-affinity takes priority over affinity.

### Examples

```
xo:load:balancer:anti-affinity=db-cluster    # Spread DB replicas across hosts
xo:load:balancer:affinity=web-servers         # Keep web servers together
xo:load:balancer:ignore                       # Never move this VM
```

## API

The plugin exposes a single JSON-RPC method:

### `tagBalancer.computePlan`

Computes a load balancing plan for a pool and optionally executes it.

**Permission:** `admin`

**Parameters:**

| Parameter | Type    | Required | Default    | Description                                   |
| --------- | ------- | -------- | ---------- | --------------------------------------------- |
| `pool`    | string  | yes      |            | Pool ID to balance                            |
| `mode`    | string  | no       | `'simple'` | `'simple'`, `'performance'`, or `'density'`   |
| `dryRun`  | boolean | no       | `true`     | If `true`, returns the plan without migrating |

**Returns:** `Record<VmId, HostId>` — a map of VM IDs to their target host IDs. Only VMs that need to move are included. Returns `{}` if the pool is already balanced.

### Modes

| Mode          | Behavior                                                           |
| ------------- | ------------------------------------------------------------------ |
| `simple`      | Only resolves affinity and anti-affinity tag constraints           |
| `performance` | Resolves tags + balances memory usage across hosts (15% tolerance) |
| `density`     | Resolves tags + balances memory usage across hosts                 |

### Usage with xo-cli

```bash
# Tag VMs
xo-cli vm.addTag id=<VM_ID> tag=xo:load:balancer:anti-affinity=db
xo-cli vm.addTag id=<VM_ID> tag=xo:load:balancer:affinity=web

# Preview migrations (dry-run, default)
xo-cli tagBalancer.computePlan pool=<POOL_ID>

# Preview with memory balancing
xo-cli tagBalancer.computePlan pool=<POOL_ID> mode=performance

# Execute migrations
xo-cli tagBalancer.computePlan pool=<POOL_ID> dryRun=false
```

## Algorithm

The placement algorithm runs in 3 phases:

1. **Anti-affinity** (highest priority): VMs sharing an anti-affinity group on the same host are separated. The smallest VMs are moved first to minimize migration cost.

2. **Affinity**: VMs sharing an affinity group are consolidated on the host that already has the most VMs from that group. Moves that would violate anti-affinity are skipped.

3. **Memory balance** (modes `performance`/`density` only): VMs are moved from overloaded hosts to underloaded hosts. A 15% tolerance around the average prevents unnecessary migrations. VMs with affinity constraints are not moved.

### Constraints

- Only **running** VMs are considered
- VMs tagged `xo:load:balancer:ignore` are excluded
- Migrations are **intra-pool only** (no cross-pool)
- No storage motion (`VM.pool_migrate` only)
- `VM.assert_can_migrate` is called before each migration
- Failed migrations are logged and skipped (other migrations continue)
- Maximum 2 concurrent migrations (configurable)

## Testing

```bash
# Build and run unit tests
yarn build && cd dist && node --test
```

22 unit tests cover tag parsing and the placement algorithm.

## License

[AGPL-3.0-or-later](https://spdx.org/licenses/AGPL-3.0-or-later) © [Vates SAS](https://vates.fr)
