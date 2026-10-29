---
sidebar_label: Tabs and tables
sidebar_position: 2
---

# Tabs, tables and the side panel

Object pages are organized in tabs. The exact set depends on the object:

| Level         | Tabs                                                                        |
| ------------- | --------------------------------------------------------------------------- |
| Xen Orchestra | Dashboard, Backups, Tasks, Pools, Hosts, VMs                                |
| Pool          | Dashboard, Stats, System, Network, Traffic rules, Storage, Tasks, Hosts, VMs     |
| Host          | Dashboard, Console, Stats, System, Network, Storage, Tasks, VMs             |
| VM            | Dashboard, Console, Backups, Stats, System, Network, VDIs, Snapshots, Tasks |

Tables (networks, tasks, backup jobs, snapshots and so on) share the same tooling everywhere:

- a **Search Engine** field with a query builder, to filter large tables precisely,
- pagination controls,
- an eye icon per row that opens the **side panel** with the details of that row, so you never lose the context of the list.

<UiShot light="/img/xo6/pool-networks-light.png" dark="/img/xo6/pool-networks-dark.png" alt="Networks of a pool, with the query builder and the side panel" url="https://your-xo/v6/#/pool/…/networks" />
