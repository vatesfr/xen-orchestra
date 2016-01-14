# Continuous delta backups

> This feature is out since 4.11 and "Continuous" since 4.12

> WARNING: it works only on XenServer 6.5 or later

You can export only the delta between your current VM disks and a previous snapshot (called here the *reference*). They are called continuous because you'll **never export a full backup** after the first one.

## Introduction

Full backups can be represented like this:

![](https://xen-orchestra.com/blog/content/images/2015/12/nodelta.png)

It means huge files for each backups. Delta backups will only export the difference between the previous backup:

![](https://xen-orchestra.com/blog/content/images/2015/12/delta_final.png)

Basically, you'll create "key" backups (full backup) and use delta from those. It's the same principle for [MPEG compression and key frame](https://en.wikipedia.org/wiki/Key_frame#Video_compression).

You can imagine to make a full backup during a weekend, and only delta backups every night. It combines the flexibility of snapshots and the power of full backups, because:

* delta are stored somewhere else than the current VM storage
* they are small
* quick to create
* easy to restore

So, if you want to rollback your VM to a previous state, the cost is only one snapshot on your SR (far less than the [rolling snapshot](rolling_snapshot.md) mechanism).

Even if you lost your whole SR or VM, you can use a Full backup to restore it completely, then apply any existing delta on top!

You can even imagine to use this to backup more often! Because delta will be smaller, and will be **always delta's**.

### Continuous

They are called continuous because you'll **never export a full backup** after the first one. We'll merge the oldest delta inside the full:

![](https://xen-orchestra.com/blog/content/images/2016/01/deltamergesmall-1.png)

This way we can go "forward" and remove this oldest VHD after the merge:

![](https://xen-orchestra.com/blog/content/images/2016/01/finaldeltasmall.png)

## Create Delta backup

Just go inside your "Backup" view, and select Delta Backup:

![](https://xen-orchestra.com/blog/content/images/2015/12/delta_menu.png)

Then, create in like a normal backup.