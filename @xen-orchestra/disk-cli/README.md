<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @xen-orchestra/disk-cli

[![Package Version](https://badgen.net/npm/v/@xen-orchestra/disk-cli)](https://npmjs.org/package/@xen-orchestra/disk-cli) ![License](https://badgen.net/npm/license/@xen-orchestra/disk-cli) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@xen-orchestra/disk-cli)](https://bundlephobia.com/result?p=@xen-orchestra/disk-cli) [![Node compatibility](https://badgen.net/npm/node/@xen-orchestra/disk-cli)](https://npmjs.org/package/@xen-orchestra/disk-cli)

> CLI tool to inspect and manage disks in backup repositories

## Install

Installation of the [npm package](https://npmjs.org/package/@xen-orchestra/disk-cli):

```sh
npm install --global @xen-orchestra/disk-cli
```

## Usage

```
$ xo-disk-cli --help
Usage: xo-disk-cli <command> <handler-url> <path> [options]

Commands:
  info       Show disk info (virtual size, uid, parent uid, block size)
  list       List all disks at a path and display their properties in a table
  transform  Convert a disk to another format and write to stdout (raw | vhd | qcow2)
```

## Commands

### `info`

Display metadata for a single disk file.

```
xo-disk-cli info <handler-url> <disk-path>
```

Output includes: UID, parent UID (for differencing disks), virtual size, and block size.

```
$ xo-disk-cli info file:///mnt/backups /xo-vm-backups/<vm-uuid>/vdis/<vdi-uuid>/snapshot.vhd
Disk info: /xo-vm-backups/<vm-uuid>/vdis/<vdi-uuid>/snapshot.vhd
  UID:          <uuid>
  Parent UID:   <parent-uuid>
  Virtual size: 8.00 GiB (8589934592 bytes)
  Block size:   2.00 MiB (2097152 bytes)
```

### `list`

List all disk files found at a directory path and display their properties in a table. Disks are sorted so that each child appears directly after its parent. When a disk's parent is the row immediately above, the parent UID column shows `↑` for quick chain health assessment.

```
xo-disk-cli list <handler-url> <dir-path>
```

```
$ xo-disk-cli list file:///mnt/backups /xo-vm-backups/<vm-uuid>/vdis/<vdi-uuid>/
┌──────────────┬──────────────────────────────────────┬─────────────┬──────────────┬─────────────┬──────────────────────────────────────┐
│ File         │ UID                                  │ Size on disk│ Virtual size │ Differencing │ Parent UID                           │
├──────────────┼──────────────────────────────────────┼─────────────┼──────────────┼─────────────┼──────────────────────────────────────┤
│ base.vhd     │ xxxxxxxx-...                         │ 1.20 GiB    │ 8.00 GiB     │ no          │ (none)                               │
│ snapshot.vhd │ yyyyyyyy-...                         │ 128.00 MiB  │ 8.00 GiB     │ yes         │ ↑                                    │
└──────────────┴──────────────────────────────────────┴─────────────┴──────────────┴─────────────┴──────────────────────────────────────┘
```

### `transform`

Convert a disk (or its full parent chain if differencing) to the specified format and write the result to stdout. Redirect to a file to save the output.

```
xo-disk-cli transform <handler-url> <disk-path> <format>
```

Supported formats:

- `raw` — flat binary image; absent blocks are written as zeros
- `vhd` — VHD fixed/dynamic image
- `qcow2` — QCOW2 image

```
$ xo-disk-cli transform file:///mnt/backups /xo-vm-backups/<vm-uuid>/vdis/<vdi-uuid>/snapshot.vhd raw > disk.img
$ xo-disk-cli transform file:///mnt/backups /xo-vm-backups/<vm-uuid>/vdis/<vdi-uuid>/snapshot.vhd qcow2 > disk.qcow2
$ xo-disk-cli transform file:///mnt/backups /xo-vm-backups/<vm-uuid>/vdis/<vdi-uuid>/snapshot.vhd vhd > disk.vhd
```

## Handler URLs

The `<handler-url>` argument identifies the remote storage backend. Examples:

| Backend          | URL format              |
| ---------------- | ----------------------- |
| Local filesystem | `file:///absolute/path` |
| NFS              | `nfs://host/export`     |
| SMB              | `smb://host/share`      |
| S3               | `s3://bucket/prefix`    |

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

[AGPL-3.0-or-later](https://spdx.org/licenses/AGPL-3.0-or-later) © [Vates SAS](https://vates.fr)
