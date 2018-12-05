# Continuous Replication

> WARNING: it works only with XenServer 6.5 or later

This feature is a continuous replication system for your XenServer VMs **without any storage vendor lock-in**. You can replicate a VM every *X* minutes/hours to any storage repository. It could be to a distant XenServer host or just another local storage target.

This feature covers multiple objectives:

* no storage vendor lock-in
* no configuration (agent-less)
* low Recovery Point Objective, from 10 minutes to 24 hours (or more)
* flexibility
* no intermediate storage needed
* atomic replication
* efficient DR (disaster recovery) process

If you lose your main pool, you can start the copy on the other side, with very recent data.

![](https://xen-orchestra.com/blog/content/images/2016/01/replication.png)

> Warning: it is normal that you can't boot the copied VM directly: we protect it. The normal workflow is to make a clone and then work on it.

## Configure it

As you'll see, it is trivial to configure. Inside the "Backup/new" section, select "Continuous Replication".

Then:

1. Select the VMs you want to protect
1. Schedule the replication interval
1. Select the destination storage (could be any storage connected to any XenServer host!)

That's it! Your VMs are protected and replicated as requested.

To protect the replication, we removed the possibility to boot your copied VM directly, because if you do that, it will break the next delta. The solution is to clone it if you need it (a clone is really quick). You can then do whatever you want with this clone!

## Manual initial seed

**If you can't transfer the first backup through your network because it's too large**, you can make a seed locally. In order to do this, follow this procedure (until we make it accessible directly in XO).  

> This is **only** if you need to make the initial copy without making the whole transfer through your network. Otherwise, **you don't need this**. These instructions are for Backup-NG jobs, and will not work to seed a legacy backup job. Please migrate any legacy jobs to Backup-NG!


## Job creation

Create the Continuous Replication backup job, and leave it disabled for now. On the main Backup-NG page, note its identifiers, the main `backupJobId` and the ID of one on the schedules for the job, `backupScheduleId`.

## Seed creation

Manually create a snapshot on the VM to backup, and note its UUID as `snapshotUuid` from the snapshot panel for the VM.

> DO NOT ever delete or alter this snapshot, feel free to rename it to make that clear.

## Seed copy

Export this snapshot to a file, then import it on the target SR.

Note the UUID of this newly created VM as `targetVmUuid`.

> DO NOT start this VM or it will break the Continuous Replication!

## Set up metadata

The XOA backup system requires metadata to correctly associate the source snapshot and the target VM to the backup job. We're going to use the `xo-cr-seed` utility to help us set them up.

First install the tool (all the following is done from the XOA VM CLI):

```
npm i -g xo-cr-seed
```

Here is an example of how the utility expects the UUIDs and info passed to it::

```
xo-cr-seed
Usage: xo-cr-seed <source XAPI URL> <source snapshot UUID> <target XAPI URL> <target VM UUID> <backup job id> <backup schedule id>

xo-cr-seed v0.2.0
```
Putting it altogether and putting our values and UUID's into the command, it will look like this (it is a long command):
```
xo-cr-seed https://root:password@xen1.company.tld 4a21c1cd-e8bd-4466-910a-f7524ecc07b1 https://root:password@xen2.company.tld 5aaf86ca-ae06-4a4e-b6e1-d04f0609e64d 90d11a94-a88f-4a84-b7c1-ed207d3de2f9 369a26f0-da77-41ab-a998-fa6b02c69b9a
```

## Finished

Your backup job should now be working correctly! Manually run the job the first time to check if everything is OK. Then, enable the job. **Now, only the deltas are sent, your initial seed saved you a LOT of time if you have a slow network.**
