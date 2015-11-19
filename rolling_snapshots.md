# Rolling snapshots

> Rolling snapshots are released since 4.2

This feature is close to Backups, but it creates a snapshot when planned to do so. It also handles the retention (to remove the oldest snapshot). This feature is very convenient to rollback to a previous state.

**Warning**: snapshots are not backups. All snapshots are on the same Storage than their original disk. If you lose the original VDI (or the SR), you'll **lose all your snapshots**.

[Read more about it](https://xen-orchestra.com/blog/xen-orchestra-4-2/#schedulerollingsnapshots).

> Advice: due to space usage, rolling snapshots should be avoided for large VMs on non-thin provisioned storages.