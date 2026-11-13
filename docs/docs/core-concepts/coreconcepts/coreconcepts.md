---
sidebar_position: 2
---

# How XO is organized

XO 6 organizes everything around a simple idea: **every level of your infrastructure gets the same treatment**. Your whole Xen Orchestra, a pool, a host or a single VM each have their own page, with a dashboard and a consistent set of tabs. Once you know how one page works, you know them all.

## The object hierarchy

Xen Orchestra manages any number of pools, wherever they are:

- **Xen Orchestra** (the top level): everything connected to this XO, across all pools and sites.
- **Pool**: a group of XCP-ng hosts sharing storage and networks, managed as one unit.
- **Host**: an XCP-ng server inside a pool.
- **VM**: a virtual machine running on a host.

The tree view on the left mirrors this hierarchy, and every page shows its object's place in it (a VM page links to its host and pool, and so on).

## Find your way in XO 6

Every page of XO 6 relies on the same building blocks:

- [Dashboards at every level](dashboards.md): the health of your infrastructure, at the scale of the page you are on.
- [Tabs, tables and the side panel](tabs-tables-side-panel.md): how object pages and their tables are organized.
- [Tasks: everything is tracked](tasks.md): the history of every operation on your infrastructure.

## Where XO 5 fits

XO 6 is an official release under active development. A few operations still live in XO 5, and XO 6 tells you explicitly: buttons and links marked with an external-link icon (for example **Manage VM lifecycle in XO 5**, or the **Stats** tab) open the right XO 5 page for that same object. Both interfaces work on the same data at the same time, so there is no synchronization to think about. The current split is documented in [XO 6 and XO 5](../../whats-new/xo6vsxo5.md).
