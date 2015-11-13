# Backups

This section is dedicated to any existing means to rollback or backup your VMs in Xen Orchestra.

## Overview

This is the welcome panel on the backup view. It recaps all existing scheduled jobs. This is also where the backup logs are displayed.

![](https://xen-orchestra.com/blog/content/images/2015/11/backupoverview.png)

## Scheduled snapshots

This feature is close to Backups, but it creates a snapshot when planned to do so. It also handles the retention (to remove the oldest snapshot). This feature is very convenient to rollback to a previous state.

**Warning**: snapshots are not backups. All snapshots are on the same Storage than their original disk. If you lose the original VDI (or the SR), you'll **lose all your snapshots**.

[Read more about it](https://xen-orchestra.com/blog/xen-orchestra-4-2/#schedulerollingsnapshots).

> Advice: due to space usage, rolling snapshots should be avoided for large VMs on non-thin provisioned storages.

## Logs

All the scheduled operations (backup, snapshots and even DR) are displayed in the main backup view.

A successful backup task will be displayed in green, a faulty one in red. You can click on the arrow to see each entry detail:

![](https://xen-orchestra.com/blog/content/images/2015/11/logs_initial.png)

You also have a filter to search anything related to these logs.