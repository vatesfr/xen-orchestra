# Mirror Backups

the goal is to replicate a backup from one remote to another. For example you make your backup to a NFS in house and then replicate to a bigger, slower and cheaper storage with a longer retention.
The source and destination can have different settings, for encryption, vhd storage mode, rentention, or compression.

## creation

Todo : when front is done

## synchronizing algorithm for full backups

Any new backup on source is transfered on remote

_key backup(full) are in upper case, delta backup are in lowercase_ . _Source has a retention of 3, destination has 4_

### First transfer

```
- source : ABC
- destination: empty
```

will transfer in order A , then B, and C. Destination will contains ABC

> **Limitation:** if the mirror retention is lower than the backup retention on the source remote, more data than necessary may be transferred during the first run, since all the backups of the source will be transfered to the destinations. Then the older backups will be purged on the destinations.

### second transfer

```
- source : BCD
- destination: ABC
```

will transfer D. Destination will contains ABCD

### third transfer

```
- source : CDE
- destination: ABCD
```

will transfer E and delete A from remote. Destination will contains BCDE

### too much change on source

```
- source : IJK
- destination:  BCDE
```

will transfer in order IJK and delete BCD from remote. Destination will contains EIJK

## synchronizing algorithm for Incremental backups

this will only tranfer new backups, and then run the same merge algorithm than in [Incremental Backups](incremental_backups.md).

_key backup(full) are in upper case, delta backup are in lowercase_ . _Source has a retention of 3, destination has 4_

### First transfer

```
- source : Abc # one key, two delta
- destination: empty
```

will transfer in order A , then b, and c. Destination will contains Abc

> **Limitation:** if the mirror retention is lower than the backup retention on the source remote, more data than necessary may be transferred during the first run, since all the backups of the source will be transfered to the destinations. Then the older backups will be purged on the destinations.

### second transfer

```
- source : Bcd # A and b have been merged
- destination:  Abc
```

transfer only the delta d , destination will contains Abcd (no merge)

### third transfer

```
- source : Cde # B and c have been merged
- destination:  Abcd
```

transfer only the delta e , destination will contains Bcde (merge A and b)

### too much change on source

```
- source : Ijk
- destination:  Bcde
```

transfer all the chain in order, destination will contains EIjk (merge B,c and d)
