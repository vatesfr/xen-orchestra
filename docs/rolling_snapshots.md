# Rolling snapshots

> Rolling snapshots are available since XOA 4.2

This feature is similar to Backups, but it creates a snapshot when planned to do so. It also handles the retention (removing the oldest snapshot). This feature is very convenient to rollback to a previous state.

**Warning**: snapshots are not backups. All snapshots are on the same storage as their original disk. If you lose the original VDI (or the SR), you'll **lose all your snapshots**.

[Read more about it](https://xen-orchestra.com/blog/xen-orchestra-4-2/#schedulerollingsnapshots).

> Advice: due to space usage, rolling snapshots should be avoided for large VMs on non-thin provisioned storages.

Example:

* Schedule a nightly snapshot for a group of VMs, let's say at 4:30 in the morning. With a max snapshot of 7, you'll have a week of revert possibility
* Schedule a snapshot every week, but precisely Sunday at 11 PM, with 4 snapshots max. This will give you a month max of revert
* And so forth!
