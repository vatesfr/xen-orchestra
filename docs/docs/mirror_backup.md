# Mirror Backups

The goal is to replicate a backup from one remote to another. For instance, you make your backup to in-house NFS storage, and then replicate to bigger, slower and cheaper storage with a longer retention.

The source and destination can have different settings for encryption, VHD storage mode, retention, or compression.

## Creation

Just go into your "Backup" view, and select Vm Mirror Backup.
Then, select if you want to mirror incremental backups or full backups.
You must have exactly one source remote, you must have one or more destinations. The mirroring speed will be limited by the slower remote.

Most options of the full/incremental backups applies here, like concurrency (number of VM transferred in parallel), report, proxy and speed limit. You can also add a health check on schedules. Please note that only the last transferred backup (if any) will be checked.

:::tip
If you have full and incremental backups on a remote, you must configure 2 mirror backup jobs, one full and one incremental.
:::

## synchronizing algorithm for full backups

Any new backup on the source is transfered to the remote

_key backup(full) are in upper case, delta backup are in lowercase_ . _Source has a retention of 3, destination has 4_

### First transfer

```
- source : ABC
- destination: empty
```

will transfer in order A , then B, and C. Destination will contains ABC

> **Limitation:** if the mirror retention is lower than the backup retention on the source remote, more data than necessary may be transferred during the first run, since all the backups of the source will be transfered to the destinations. Then the older backups will be purged on the destinations.

### Second transfer

```
- source : BCD
- destination: ABC
```

will transfer D. Destination will contains ABCD

### Third transfer

```
- source : CDE
- destination: ABCD
```

will transfer E and delete A from remote. Destination will contains BCDE

### if there is too much change on source

```
- source : IJK
- destination:  BCDE
```

will transfer in order IJK and delete BCD from remote. Destination will contains EIJK

## Synchronizing algorithm for incremental backups

this will only transfer new backups, and then run the same merge algorithm than in [Incremental Backups](incremental_backups.md).

_key backup(full) are in upper case, delta backup are in lowercase_ . _Source has a retention of 3, destination has 4_

### First transfer

```
- source : Abc # one key, two delta
- destination: empty
```

will transfer in order A , then b, and c. Destination will contains Abc

> **Limitation:** if the mirror retention is lower than the backup retention on the source remote, more data than necessary may be transferred during the first run, since all the backups of the source will be transfered to the destinations. Then the older backups will be purged on the destinations.

### Second transfer

```
- source : Bcd # A and b have been merged
- destination:  Abc
```

transfer only the delta d , destination will contains Abcd (no merge)

### Third transfer

```
- source : Cde # B and c have been merged
- destination:  Abcd
```

transfer only the delta e , destination will contains Bcde (merge A into b)

### if there is too much change on source

```
- source : Ijk
- destination:  Bcde
```

transfer all the chain in order, destination will contains EIjk (merge B,c and d into e)
