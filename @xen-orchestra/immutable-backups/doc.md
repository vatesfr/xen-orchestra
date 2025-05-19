# Imutability

the goal is to make a remote that XO can write, but not modify during the immutability duration set on the remote. That way, it's not possible for XO to delete or encrypt any backup during this period. It protects your backup against ransomware, at least as long as the attacker does not have a root access to the remote server.

We target `governance` type of immutability, **the local root account of the remote server will be able to lift immutability**.

We use the file system capabilities, they are tested on the protection process start.

It is compatible with encryption at rest made by XO.

## Prerequisites

The commands must be run as root on the remote, or by a user with the `CAP_LINUX_IMMUTABLE` capability . On start, the protect process writes into the remote `imutability.json` file its status and the immutability duration.

the `chattr` and `lsattr` should be installed on the system

## Configuring

this package uses app-conf to store its config. The application name is `xo-immutable-backup`. A sample config file is provided in this package.

## Making a file immutable

when marking a file or a folder immutable, it create an alias file in the `<indexPath>/<DayOfFileCreation>/<sha256(fullpath)>`.

`indexPath` can be defined in the config file; otherwise, `XDG_HOME` is used. If not available it goes to `~/.local/share`

This index is used when lifting the immutability of the remote, it will only look at the old enough `<indexPath>/<DayOfFileCreation>/` folders.

## Real time protecting

On start, the watcher will create the index if it does not exists.
It will also do a checkup to ensure immutability could work on this remote and handle the easiest issues.

The watching process depends on the backup type, since we don't want to make temporary files and cache immutable.

It won't protect files during upload, only when the files have been completly written on disk. Real time, in this case, means "protecting critical files as soon as possible after they are uploaded"

This can be alleviated by :

- Coupling immutability with encryption to ensure the file is not modified
- Making health check to ensure the data are exactly as the snapshot data

List of protected files :

```js
const PATHS = [
  // xo configuration backupq
  'xo-config-backups/*/*/data',
  'xo-config-backups/*/*/data.json',
  'xo-config-backups/*/*/metadata.json',
  // pool backupq
  'xo-pool-metadata-backups/*/metadata.json',
  'xo-pool-metadata-backups/*/data',
  // vm backups , xo-vm-backups/<vmuuid>/
  'xo-vm-backups/*/*.json',
  'xo-vm-backups/*/*.xva',
  'xo-vm-backups/*/*.xva.checksum',
  // xo-vm-backups/<vmuuid>/vdis/<jobid>/<vdiUuid>
  'xo-vm-backups/*/vdis/*/*/*.vhd', // can be an alias or a vhd file
  // for vhd directory :
  'xo-vm-backups/*/vdis/*/*/data/*.vhd/bat',
  'xo-vm-backups/*/vdis/*/*/data/*.vhd/header',
  'xo-vm-backups/*/vdis/*/*/data/*.vhd/footer',
]
```

## Releasing protection on old enough files on a remote

the watcher will periodically check if some file must by unlocked

## Troubleshooting

### some files are still locked

add the `rebuildIndexOnStart` option to the config file

### make remote fully mutable again

- Update the immutability setting with a 0 duration
- launch the `liftProtection` cli.
- remove the `protectRemotes` service

### increasing the immutability duration

this will prolong immutable file, but won't protect files that are already out of immutability

### reducing the immutability duration

change the setting, and launch the `liftProtection` cli , or wait for next planed execution

### why are my incremental backups not marked as protected in XO ?

are not marked as protected in XO ?

For incremental backups to be marked as protected in XO, the entire chain must be under protection. To ensure at least 7 days of backups are protected, you need to set the immutability duration and retention at 14 days, the full backup interval at 7 days

That means that if the last backup chain is complete ( 7 backup ) it is completely under protection, and if not, the precedent chain is also under protection. K are key backups, and are delta

```
Kd Kdddddd Kdddddd K #  8 backups protected, 2 chains
K Kdddddd Kdddddd Kd #  9 backups protected, 2 chains
 Kdddddd Kdddddd Kdd # 10 backups protected, 2 chains
 Kddddd Kdddddd Kddd # 11 backups protected, 2 chains
 Kdddd Kdddddd Kdddd # 12 backups protected, 2 chains
 Kddd Kdddddd Kddddd # 13 backups protected, 2 chains
 Kdd Kdddddd Kdddddd #  7 backups protected, 1 chain since precedent full is now mutable
Kd Kdddddd Kdddddd K #  8 backups protected, 2 chains
```

### Why doesn't the protect process start ?

- it should be run as root or by a user with the `CAP_LINUX_IMMUTABLE` capability
- the underlying file system should support immutability, especially the `chattr` and `lsattr` command
- logs are in journalctl
