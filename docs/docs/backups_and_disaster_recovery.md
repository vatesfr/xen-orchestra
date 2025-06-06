# Backups and Disaster Recovery

This section is dedicated to any existing means to rollback or backup your VMs in Xen Orchestra.

## Full backups

You can schedule full backups of your VMs, by exporting them in the local XOA file-system, or directly in a NFS share. "Depth" parameter allow to modify the retention (removing the oldest one).

![](https://xen-orchestra.com/blog/content/images/2015/07/backupexample.png)

[Read more here](https://xen-orchestra.com/blog/backup-your-xenserver-vms-with-xen-orchestra/).

Full backups are space consuming! But they allow a very simple restoration without anything to think of (the file will contain all the VM disks and information.

### Restore backups

All your scheduled backup are accessible in the "Restore" view in backup section of Xen Orchestra.

1. Select your mountpoint
2. Choose the file you want to restore
3. Select the host/pool you want to restore it

![](https://xen-orchestra.com/blog/content/images/2015/11/restore.png)

### Backup compression

By default, Backup are compressed (using GZIP, done in XenServer side). There is no absolute rule about using compression or not, but there is some rules.

Gzip compression is:

- slow
- space efficient
- consume less bandwidth (if your NFS share is far)

If you have compression on your NFS share (or destination file-system like ZFS), you can disable compression in Xen Orchestra.

Here is a network usage graph with 2 identical backup, the first one without compression:

![](https://xen-orchestra.com/blog/content/images/2015/11/networkdetail.png)

## Scheduled snapshots

This feature is close to Backups, but it creates a snapshot when planned to do so. It also handles the retention (to remove the oldest snapshot).

**Warning**: snapshots are not backups. They help to rollback to a previous state, but all snapshots are on the same Storage than their original disk. If you lose the original VDI (or the SR), you'll **lose all your snapshots**.

[Read more about it](https://xen-orchestra.com/blog/xen-orchestra-4-2/#schedulerollingsnapshots).
