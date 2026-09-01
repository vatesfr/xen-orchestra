# XO 6 and XO 5

XO 6 and XO 5 are two interfaces to the same Xen Orchestra. They run side by side, on the same server, against the same data: a VM started in one is instantly running in the other, a backup job created in XO 5 immediately shows its health in XO 6. There is no migration step and nothing to synchronize.

- **XO 6** is the default interface and the future of Xen Orchestra.
- **XO 5** remains fully available for everything XO 6 does not cover yet: use the **XO 5** link in the top-right corner, or the marked links that XO 6 shows contextually (they open the right XO 5 page for the object you are on).

## What lives where today

XO 6 is under active development, so this table evolves with every release. As a rule of thumb: observing and operating your infrastructure day to day happens in XO 6; deep configuration still happens in XO 5.

| Area                     | In XO 6                                                                                                                                             | Still in XO 5                                                                  |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Navigation and search    | Tree view of all pools, hosts, VMs, with live filtering and a query builder on every major table                                                    | Object list pages                                                              |
| Dashboards               | Global, pool, host and VM dashboards: status, alarms, patches, resources, usage charts, backup health                                               | Global dashboard, health view                                                  |
| VM lifecycle             | Start (including on a specific host), pause, suspend, resume, reboot, shutdown (normal and forced), duplicate, export as XVA or OVA, delete         | Migrate, copy between pools, convert to template, import, self-service         |
| VM creation              | Full single-VM form: template, cloud-init or SSH key or ISO or PXE install, boot firmware, vTPM, Secure Boot, affinity, HA, vCPUs, RAM, VIFs, disks | Multiple VMs at once, tags at creation                                         |
| Consoles                 | VM and host consoles: fullscreen, chrome-less dedicated tab, Ctrl+Alt+Del                                                                           | Console clipboard (coming soon in XO 6)                                        |
| Snapshots                | List, take, revert, delete                                                                                                                          | Snapshot detail view                                                           |
| Networks                 | Inspect pool, host and VM networking; create networks (bonded, host internal), create and manage VIFs, traffic rules                                | Edit existing networks, SDN controller                                         |
| Storage                  | Inspect SRs and VDIs; connect, disconnect and delete SRs; create, attach, export, delete VDIs and migrate them between SRs                          | SR creation, advanced disk operations                                          |
| Performance stats        | Usage charts on every dashboard (last week)                                                                                                         | Full stats views with granularity control, via the marked Stats link           |
| Backups                  | Job list with run history, per-job pages (runs, configuration, backed up VMs, targets), per-VM protection status, dashboard health panels           | Job creation and editing, restore, remotes, mirrors, sequences, health checks  |
| Tasks                    | Full task history at every level, last-24-hours quick view                                                                                          | Task list                                                                      |
| Users and access         | Users list with details, groups and authentication tokens                                                                                           | User creation and editing, groups, roles, LDAP and other auth providers, ACLs  |
| Settings                 | Color mode, five themes, 21 languages                                                                                                               | Servers, plugins, proxies, licenses, everything under Settings                 |
| Pool and host operations | Connect and disconnect pools, host start, shutdown, enable, disable, PIF scan, bug-tools archive                                                    | Patching and updates, rolling pool update, host maintenance and evacuation, HA |

One more current limitation to know: XO 6 requires an administrator account. Non-admin users are redirected to XO 5 until delegation lands in XO 6.

## Which one should I use?

Start every session in XO 6: navigation, monitoring, consoles, task forensics and backup oversight are simply better there. When you hit an operation XO 6 does not do yet, it will either show you the action marked with an external-link icon, or you switch to XO 5 manually and come right back.

If you prefer to keep XO 5 as your default interface for now, the welcome message of XO 6 links to the procedure to do so.
