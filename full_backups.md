# Full backups

You can schedule full backups of your VMs, by exporting them in the local XOA file-system, or directly in a NFS share. "Depth" parameter allow to modify the retention (removing the oldest one).

[![](https://xen-orchestra.com/blog/content/images/2015/07/backupexample.png)](https://xen-orchestra.com/blog/backup-your-xenserver-vms-with-xen-orchestra/)

Full backups are space consuming! But they allow a very simple restoration without anything to think of (the file will contain all the VM disks and information).

## Remote stores

This where you can create your stores, places where your backups will be exported.

![](https://xen-orchestra.com/blog/content/images/2015/11/remotestores.png)

Supported stores:

* local stores (any folder in XOA filesystem)
* NFS stores


### Other stores

We'll support CIFS stores soon. Until then, if you need to mount an unsupported store, you could always do it manually:

1. mount your store inside XOA manually, e.g in `/media/myCIFSstore`
2. in the web interface, select a "local" store and point it to your `/media/myCIFSstore` folder.

Any Debian Linux mount point could be supported this way, until we add further options directly in the web interface.

## Restore backups

All your scheduled backup are acccessible in the "Restore" view in backup section of Xen Orchestra.

1. Select your mountpoint
2. Choose the file you want to restore
3. Select the host/pool you want to restore it

![](https://xen-orchestra.com/blog/content/images/2015/11/restore.png)


## About backup compression

By default, Backup are compressed (using GZIP, done in XenServer side). There is no absolute rule about using compression or not, but there is some rules.

Gzip compression is:

* slow
* space efficient
* consume less bandwidth (if your NFS share is far)

If you have compression on your NFS share (or destination file-system like ZFS), you can disable compression in Xen Orchestra.

Here is a network usage graph with 2 identical backup, the first one without compression:

![](https://xen-orchestra.com/blog/content/images/2015/11/networkdetail.png)
