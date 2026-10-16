# Hashed disks (`.hbd`)

A content addressed disk format: each block is stored once, named after the SHA-256 of its content.

- [File structure on remote](#file-structure-on-remote)
- [Files](#files)
  - [`<datetime>.hbd`](#datetimehbd)
  - [`hashes.<ms>.<random>.hash`](#hashesmsrandomhash)
  - [Block file](#block-file)
- [Dedup types](#dedup-types)
- [Reference counting](#reference-counting)
  - [Link limit (`EMLINK`)](#link-limit-emlink)
- [Lifecycle](#lifecycle)

## File structure on remote

```
<remote>
├─ xo-vm-backups
│  └─ <VM UUID>
│     └─ vdis
│        └─ <job UUID>
│           └─ <VDI UUID>
│              ├─ <YYYYMMDD>T<HHmmss>.hbd           // one per backup
│              └─ data
│                 └─ <disk UUID at creation>
│                    ├─ hashes.<ms>.<random>.hash  // the BAT
│                    └─ blocks
│                       └─ <ab>/<cd>/<hash>         // one file per unique block
└─ xo-block-store                                   // PER_BACKUP_REPOSITORY only
   └─ <ab>/<cd>/<hash>
      ├─ 0                                          // store copy
      └─ 1, 2…                                      // overflow copies, when 0 hits the link limit
```

- `<ab>/<cd>`: the first 2 bytes of the hash, so at most 256 entries per level whatever the number of blocks
- `<hash>`: the full hash, 64 hex characters
- the data directory keeps the uuid the disk had when it was created: a merge changes the disk uuid, not the directory

## Files

### `<datetime>.hbd`

```json
{
  "version": "0.0.1",
  "virtualSize": 21474836480,
  "blockSize": 2097152,
  "uuid": "<disk UUID>",
  "parentUuid": "<parent UUID>",
  "parentPath": "./<parent datetime>.hbd",
  "dedupType": "PER_BACKUP_REPOSITORY",
  "localBlocksPath": "data/<disk UUID at creation>/blocks/",
  "hashesPath": "data/<disk UUID at creation>/hashes.<ms>.<random>.hash"
}
```

- paths are relative to the `.hbd` file, and must stay inside the disk data directory
- `parentUuid` / `parentPath` are absent on a full disk

### `hashes.<ms>.<random>.hash`

The BAT: a flat binary file, one 32-byte SHA-256 per block index.

```
offset  index * 32
size    ceil(virtualSize / blockSize) * 32
empty   32 zero bytes
```

- a new file at each flush, never overwritten: the `.hbd` points at the current one
- any other `hashes.*.hash` in the same directory is a leftover of a crash

### Block file

```
0..511    header
  0..3      magic "HBD\0"
  4         codec (0 raw, 1 brotli)
  8..15     verifiedAt (ms, 0 = never)
  16..47    SHA-256 of the payload
  48..51    payloadLength (uint32 LE, never 0)
  52..511   reserved (zero)
512..     payload (payloadLength bytes)
```

## Dedup types

| `dedupType`             | Blocks                                                            | Needs hard links |
| ----------------------- | ----------------------------------------------------------------- | ---------------- |
| `PER_DISK`              | real files in the disk `blocks/`                                  | no               |
| `PER_BACKUP_REPOSITORY` | hard links to `xo-block-store`, shared by all disks of the remote | yes              |

- `PER_DISK` for remotes without hard links (S3, Azure)
- the store location is given by the caller, never read from the `.hbd`
  - `BLOCK_STORE_PATH` (`xo-block-store`) by default

## Reference counting

No counter file: the link count of the inode is the count.

```
xo-block-store/<h>/0  ─┐
diskA/blocks/<h>      ─┼──▶ [ inode ]  nlink = 3
diskB/blocks/<h>      ─┘
```

- `nlink - 1` = number of disks using the block
- a store file at `nlink = 1` is used by no disk: the GC scan (`scanBlockStore`) removes it
  - maintenance only, run by an admin with no backup job running: `xo-disk-cli scan-store <remote url> [--remove] [--verify]`
  - after a backup cleanup: a leftover temp file (`blocks/.tmp/`) keeps its store file at `nlink = 2` until the disk `clean()` removes it
- reads always go through the disk own link, never through the store

### Link limit (`EMLINK`)

An inode accepts a limited number of links (ext4: 65000, XFS: 65535). A common block, the all-zero one first, can reach it on a large remote.

```
xo-block-store/<h>/0  ─┐
disk 1 … disk 64999   ─┴──▶ [ inode #1 ]  nlink = 65000 (full)

xo-block-store/<h>/1  ─┐
disk 65000            ─┴──▶ [ inode #2 ]  nlink = 2
```

- `link` fails with `EMLINK` on `0`: try the next copies `1`, `2`…
- all full: publish a new copy `N+1`, then link to it
- each copy is its own inode, so its count is independent
- releasing a block removes the copy that drops to `nlink = 1`, not always `0`

## Lifecycle

| Step   | What happens                                                                                       |
| ------ | -------------------------------------------------------------------------------------------------- |
| write  | link from the store, or publish a new store file (temp file, then `link`)                          |
| flush  | new BAT, then `.hbd`, then release the blocks no index uses any more, then remove the previous BAT |
| merge  | parent takes the child blocks and uuid, then is renamed to the child path                          |
| unlink | release every block of the BAT, then remove the data directory and the `.hbd`                      |
| clean  | `clean()` removes leftover BATs, `scanBlockStore` removes store files at `nlink = 1`               |

- write: `writeHbd(handler, path, source, { uuid, parentUuid, parentPath })`, called by `RemoteAdapter.writeDisk` when the remote `diskFormat` is `hbd`
  - on failure, waits for the pending block writes, then `unlink()`: no reference is left behind
- merge: the child is a `HashedDiskChain` (opened by `openDiskChain`), never a bare disk
  - `mergeBlock` links `child.getBlockPath(index)` into the parent, skipped when the parent already holds the same hash
- clean: `clean()` is the disk hook called by `RemoteDiskLineage`; it also removes leftover temp files (`blocks/.tmp/`)

- releasing a block: unlink the disk link, and the store file too if this disk was its last user
- a crash at any step leaves a readable disk: only leftovers, cleaned later
