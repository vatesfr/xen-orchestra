# Continuous Delta backups

You can export only the delta (difference) between your current VM disks and a previous snapshot (called here the _reference_). They are called _continuous_ because you'll **never export a full backup** after the first one.

## Introduction

Full backups can be represented like this:

![](./assets/nodelta.png)

It means huge files for each backup. Delta backups will only export the difference between the previous backup:

![](./assets/delta_final.png)

You can imagine making your first initial full backup during a weekend, and then only delta backups every night. It combines the flexibility of snapshots and the power of full backups, because:

- delta are stored somewhere else than the current VM storage
- they are small
- quick to create
- easy to restore

So, if you want to rollback your VM to a previous state, the cost is only one snapshot on your SR (far less than the [rolling snapshot](rolling_snapshot.md) mechanism).

Even if you lost your whole SR or VM, XOA will restore your VM entirely and automatically, at any date of backup.

You can even imagine using this to backup more often! Because deltas will be smaller, and will **always be deltas**.

### Continuous

They are called continuous because you'll **never export a full backup** after the first one. We'll merge the oldest delta into the full:

![](./assets/deltamerge1.png)

This way we can go "forward" and remove this oldest VHD after the merge:

![](./assets/deltamerge2.png)

## Create Delta backup

Just go into your "Backup" view, and select Delta Backup. Then, it's the same as a normal backup.

## Snapshots

Unlike other types of backup jobs which delete the associated snapshot when the job is done and it has been exported, delta backups always keep a snapshot of every VM in the backup job, and uses it for the delta. Do not delete these snapshots!

## Delta backup initial seed

If you don't want to do an initial full directly toward the destination, you can create a local delta backup first, then transfer the files to your destination.

Then, only the diff will be sent.

1. create a delta backup job to the first remote
1. run the backup (full)
1. edit the job to target the other remote
1. copy files from the first remote to the other one
1. run the backup (delta)

## Full backup interval

This advanced setting defines the number of backups after which a full backup is triggered, ie the maximum length of a delta chain.

For example, with a value of 2, the first two backups will be a full and a delta, and the third will start a new chain with a full backup.

This is important because on rare occasions a backup can be corrupted, and in the case of delta backups, this corruption might impact all the following backups in the chain. Occasionally performing a full backup limits how far a corrupted delta backup can propagate.

The value to use depends on your storage constraints and the frequency of your backups, but a value of 20 is a good start.
