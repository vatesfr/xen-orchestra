# Delta backups

> This feature will be out when delta VHDs will be officially supported by Citrix, in XenServer (Dundee).

The next version of XenServer will support delta VHD export. It means you can export only the delta between your current VM disks and a previous snapshot (called here the *reference*).

It's very similar to VEEAM *Forward Incremental Backup*, as explained in [their documentation](http://helpcenter.veeam.com/backup/80/hyperv/forward_incremental_backup.html):

![](https://cloud.githubusercontent.com/assets/1241401/11272216/8c70cc04-8ecb-11e5-80ca-63c3751fa4f8.png)

Basically, you'll create "key" backups (full backup) and use delta from those. It's the same principle for [MPEG compression and key frame](https://en.wikipedia.org/wiki/Key_frame#Video_compression).

You can imagine to make a full backup during a weekend, and only delta backups every night. It combines the flexibility of snapshots and the power of full backups, because:

* delta are stored somewhere else than the current VM storage
* they are small
* easy to restore

So, if you want to rollback your VM to a previous state, the cost is only one snapshot on your SR (far less than the [rolling snapshot](rolling_snapshot.md) mechanism).

Even if you lost your whole SR or VM, you can use a Full backup to restore it completely, then apply any existing delta on top!

## Challenges

* XenServer delta VHD support
* GUI to restore in one click multiples *.vhd files
* The "key" snapshot must NOT be deleted by the user