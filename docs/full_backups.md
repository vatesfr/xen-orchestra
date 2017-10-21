# Full backups

You can schedule full backups of your VMs, by exporting them in the local XOA file-system, or directly in a NFS or SMB share. "rentention" parameter allow to modify the retention (removing the oldest one).

[![](./assets/backupexample.png)](https://xen-orchestra.com/blog/backup-your-xenserver-vms-with-xen-orchestra/)

Full backups are space consuming! But they allow a very simple restoration without anything to think of (the file will contain all the VM disks and information).

## How it works

Full backups are using XenServer VM export capabilities. We are storing and rotating XVA files. It works very well. If you want to use less disk space, take a look at the [delta backups](delta_backups.md) feature.
