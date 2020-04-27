# Concepts

This section is dedicated to all general concepts about Xen Orchestra backups.

## Interface

### Overview

This is the welcome panel for the backup view. It recaps all existing scheduled jobs. This is also where the backup logs are displayed.

### Logs

All the scheduled operations (backup, snapshots and even DR) are displayed in the main backup view.

A successful backup task will be displayed in green, a faulty one in red. You can click on the arrow to see each entry detail.

You also have a filter to search anything related to these logs.

:::tip
Logs are not "live" tasks. If you restart XOA during a backup, the log associated with the job will stay in orange (in progress), because it wasn't finished. It will stay forever unfinished because the job was cut in the middle.
:::

## Backups execution

Each backups' job execution is identified by a `runId`. You can find this `runId` in its detailed log.

![](./assets/log-runId.png)

## Smart Backup

There are two ways to select which VMs will be backed up:

1. Manually selecting multiple VM's
1. Smart backup

Picking VMs manually can be a limitation if your environment moves fast (i.e. having new VMs you need to backup often). In that situation you would previously need to constantly go back and edit the backup job to add new VM's.

But thanks to _smart backup_, you now have more flexibility: you won't select specific VMs, but VMs status/tag/placement **at the time backup job will be executed**. Let's see some examples!

### Backup all VMs on a pool

This job will backup all VMs on a pool "Lab Pool" when scheduled:

![](https://xen-orchestra.com/blog/content/images/2016/08/xo5smartbackup1.png)

It means: **every VM existing on this pool at the time of the backup job will be backed up**. Doesn't matter if you create a new VM, it will be backed up too without editing any backup job.

**You now have the ability to intelligently backup VM's in production pools!**

Want to narrow the job a bit? See below.

### Backup filters

You can also:

- backup only running (or halted) VMs when the job is executed
- backup only VMs with a specific tag

Remember the Prod VMs? I added a tag "prod" to each of them:

![](https://xen-orchestra.com/blog/content/images/2016/08/xo5smartbackuptag.png)

Now if you do this:

![](https://xen-orchestra.com/blog/content/images/2016/08/xo5smartbackup2.png)

It means any VMs on "Lab Pool" with the "prod" tag will be backed up.

## Consistent backup

:::warning
This feature is being deprecated in XCP-ng and Citrix Hypervisor. It's now replaced by RAM enabled backup!
:::

All backup types rely on snapshots. But what about data consistency? By default, Xen Orchestra will try to take a **quiesced snapshot** every time a snapshot is done (and fall back to normal snapshots if it's not possible).

Snapshots of Windows VMs can be quiesced (especially MS SQL or Exchange services) after you have installed Xen Tools in your VMs. However, [there is an extra step to install the VSS provider on windows](https://xen-orchestra.com/blog/xenserver-quiesce-snapshots/). A quiesced snapshot means the operating system will be notified and the cache will be flushed to disks. This way, your backups will always be consistent.

To see if you have quiesced snapshots for a VM, just go into its snapshot tab, then the "info" icon means it is a quiesced snapshot:

![](./assets/quiesced1.png)

The tooltip confirms this:

![](./assets/quiesced2.png)

## Remotes

> Remotes are places where your _backup_ and _delta backup_ files will be stored.

To add a _remote_, go to the **Settings/Remotes** menu.

Supported remote types:

- Local (any folder in XOA filesystem)
- NFS
- SMB (CIFS)

:::warning
The initial "/" or "\\" is automatically added.
:::

### NFS

On your NFS server, authorize XOA's IP address and permissions for subfolders. That's all!

### SMB

We support SMB storage on _Windows Server 2012 R2_.

:::warning
For continuous delta backup, SMB is **NOT** recommended (or only for small VMs, eg < 50GB)
:::

Also, read the UI twice when you add an SMB store. If you have:

- `192.168.1.99` as SMB host
- `Backups` as folder
- no subfolder

You'll have to fill it like this:

![](./assets/smb_fill.png)

:::warning
PATH TO BACKUP is only needed if you have subfolders in your share.
:::

### Local

> **This is for advanced users**. Using the local XOA filesystem without extra mounts/disks will **use the default system disk of XOA**.

If you need to mount an unsupported store (FTP for example), you can always do it manually:

1. mount your remote store inside the XOA filesystem manually, e.g in `/media/myStore`
2. in the web interface, select a "local" store and point it to your `/media/myStore` folder.

Any Debian Linux mount point could be supported this way, until we add further options directly in the web interface.

## Restore a backup

All your scheduled backups are acccessible in the "Restore" view in the backup section of Xen Orchestra.

1. Select your remote and click on the eye icon to see the VMs available
2. Choose the backup you want to restore
3. Select the SR where you want to restore it

:::tip
You can restore your backup even on a brand new host/pool and on brand new hardware.
:::

## About backup compression

By default, _Backups_ are compressed (using GZIP or zstd, done on host side). There is no absolute rule but in general uncompressed backups are faster than GZIP backups (but sometimes much larger).

Citrix Hypervisor uses Gzip compression, which is:

- slow (single threaded)
- space efficient
- consumes less bandwidth (helpful if your NFS share is far away)

However, XCP-ng is using `zstd`, which is far better.

:::tip
If you have compression on your NFS share (or destination filesystem like ZFS), you can disable compression in Xen Orchestra.
:::

## Add a disk for local backups

If you want to use XOA to locally store all your backups, you need to attach a large disk to it. This can be done live.

First, after your disk is attached to XOA, you'll have to find the new disk name with `fdisk -l`. It's probably `xvdb`.

Then, create a filesystem on it:

```
mkfs.ext4 /dev/xvdb
```

If you already have backups done, you can move them to the new disk. The orignal backups folder is in `/var/lib/xoa-backups`.

To make the mount point persistent in XOA, edit the `/etc/fstab` file, and add:

```
/dev/xvdb /var/lib/xoa-backups ext4 defaults 0 0
```

This way, without modifying your previous scheduled snapshot, they will be written to this new local mountpoint!

## HA behavior

Replicated VMs HA are taken into account by XCP-ng. To avoid the resultant troubles, HA will be disabled from the replicated VMs and a tag indicating this change will be added.

![](./assets/disabled-dr-ha-tag.png)
![](./assets/disabled-cr-ha-tag.png)

:::tip
The tag won't be automatically removed by XO on the replicated VMs, even if HA is re-enabled.
:::
