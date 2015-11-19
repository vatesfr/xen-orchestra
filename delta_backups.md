# Delta backups

> This feature will be out when delta VHDs will be officially supported by Citrix, in XenServer (Dundee).

The next version of XenServer will support delta VHD export. It means you can export only the delta between your current VM disks and a previous snapshot.

It's very similar to VEEAM *Forward Incremental Backup*, as explained in their documentation:

![](https://camo.githubusercontent.com/524e8541c12acac6646b0e9352eb2ff090a15492/687474703a2f2f68656c7063656e7465722e766565616d2e636f6d2f6261636b75702f38302f6879706572762f666f72776172645f696e6372656d656e74616c5f636861696e2e706e67)

Basically, you'll create "key" backups (full backup) and use delta from those. It's the same principle for MPEG compression and key frame.

You can imagine to make a full backup during a weekend, and only delta backups every night. It combines the flexibility of snapshots and the power of full backups, because:

* delta are stored somewhere else than the current VM storage
* they are small
* you can restore easily