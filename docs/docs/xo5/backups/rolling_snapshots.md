# Rolling snapshots

:::warning
Snapshots aren't really a backup, but a convenient way to rollback in time. All snapshots are on the same storage as their original disk: if you lose the original disk or storage, you'll **lose all your snapshots**. Also, they are not mutually exclusive with backups.

We strongly advise that you do NOT rely only on snapshots!
:::

This feature is similar to Backups, but it creates a snapshot when planned to do so. It also handles the retention (removing the oldest snapshot). This feature is very convenient to rollback to a previous state.

:::tip
:construction_worker: This section needs to be completed: screenshots and how-to :construction_worker:
:::

:::tip
Due to space usage, rolling snapshots should be avoided for large VMs on non-thin provisioned storages.
:::

## Examples

- Schedule a nightly snapshot for a group of VMs, let's say at 4:30 in the morning. With a max snapshot of 7, you'll have a week of revert possibility
- Schedule a snapshot every week, but precisely Sunday at 11 PM, with 4 snapshots max. This will give you a month max of revert
- And so forth!
