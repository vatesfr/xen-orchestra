# The VMDK formats

Reference for what this package reads and writes. The authoritative documentation is
[libvmdk's](https://github.com/libyal/libvmdk/blob/main/documentation/VMWare%20Virtual%20Disk%20Format%20%28VMDK%29.asciidoc);
this file only describes the parts XO uses, and the choices made in this package.

All the structures are little-endian, and every offset called a _sector offset_ is in units of 512
bytes.

## Descriptor and files

A VMDK is always **a text descriptor plus one extent**. Two layouts exist, both must be supported:

1. **embedded descriptor**: a single file, made of a sparse extent header, the descriptor (at
   `descriptorOffsetSectors`, usually sector 1) and the data. This is `monolithicSparse` and
   `streamOptimized`.
2. **separate descriptor**: `disk.vmdk` is a **text** file describing an extent held in a sibling
   file — `disk-flat.vmdk` (raw extent), `disk-delta.vmdk` (COWD) or `disk-sesparse.vmdk`
   (SeSparse). This is what ESXi produces.

```
# Disk DescriptorFile
version=1
CID=d7980f7a                      content id of this disk
parentCID=ffffffff                ffffffff for a full disk, else the CID of the parent
createType="vmfs"                 monolithicSparse | streamOptimized | vmfs | vmfsSparse | seSparse | ...
parentFileNameHint="base.vmdk"    only for a delta

# Extent description
RW 67108864 VMFS "disk-flat.vmdk"      access, size in sectors, type, file name (optional offset)

# The Disk Data Base
ddb.adapterType = "lsilogic"
ddb.geometry.cylinders / .heads / .sectors
ddb.thinProvisioned = "1"
```

Rules applied by this package:

- one extent per VMDK; multi extents (`twoGbMaxExtentSparse`) are refused explicitly;
- the extent name and `parentFileNameHint` are resolved **relatively to the directory of the
  descriptor**. In a browser, where there is no directory, they are resolved by base name among the
  files given to the accessor;
- an extent name starting with `vsan://` is refused, there is no direct access to it;
- `parentCID` must match the `CID` of the parent that is opened, a mismatch is an error carrying
  both values.

## Sparse extent header — 512 bytes

Used by `monolithicSparse` and `streamOptimized`.

| Offset | Size | Field                                                                      |
| -----: | ---: | -------------------------------------------------------------------------- |
|      0 |    4 | magic `KDMV`                                                               |
|      4 |    4 | version: 1, 2 or 3                                                         |
|      8 |    4 | flags, see below                                                           |
|     12 |    8 | capacity of the virtual disk, in sectors                                   |
|     20 |    8 | size of the data of a grain, in sectors (128 = 64KiB for stream optimized) |
|     28 |    8 | sector offset of the embedded descriptor, 0 if there is none               |
|     36 |    8 | size of the descriptor, in sectors                                         |
|     44 |    4 | `numGTEsPerGT`: number of entries of a grain table (512)                   |
|     48 |    8 | sector offset of the redundant grain directory                             |
|     56 |    8 | sector offset of the grain directory, `-1` when only the footer knows it   |
|     64 |    8 | `overHead`: first sector available for grain data                          |
|     72 |    1 | unclean shutdown                                                           |
|     73 |    4 | end of line mangling detector: `'\n', ' ', '\r', '\n'`                     |
|     77 |    2 | compression: 0 none, 1 deflate                                             |
|     79 |  433 | padding                                                                    |

Flags: bit 0 end of line test, bit 1 redundant grain directory, bit 2 zeroed grain table entries,
bit 16 compressed grains, bit 17 markers. A stream optimized extent sets
`1 | 1<<1 | 1<<16 | 1<<17`.

The 8 bytes fields do not fit in a JavaScript `number`: this package reads them as `BigInt` and
throws if the value is not a safe integer, rather than silently truncating to 48 bits the way the
previous implementations did.

## Grain directory and grain tables

- the **grain directory** is an array of `uint32`: each entry is the sector offset of a grain table,
  0 when there is none;
- a **grain table** is an array of `numGTEsPerGT` (512) `uint32`: each entry is the sector offset of
  a grain, 0 when the grain is not present, 1 for a zeroed grain when the flag bit 2 is set;
- one directory entry therefore covers `numGTEsPerGT × grainSize`, 32MiB with 64KiB grains;
- `grainDirectoryEntries = ceil(ceil(capacitySectors / grainSizeSectors) / numGTEsPerGT)`;
- since those offsets are 32 bits sector offsets, **nothing can be addressed past 2TiB of file
  offset**.

## Stream optimized: markers

Everything is sector aligned. Two shapes:

- **grain marker**: `uint64` logical address of the grain in sectors at 0, `uint32` compressed
  length at 8, deflate data (a zlib stream, not raw deflate) from 12, zero padded to the next
  sector;
- **metadata marker**: a whole sector of zeros, with `uint64 = 0` at 0, `uint32 size = 0` at 8 and
  `uint32 type` at 12. `size = 0` is what tells the two shapes apart. Types: `EOS = 0`, `GT = 1`,
  `GD = 2`, `FOOTER = 3`.

In the canonical layout the grain directory and the grain tables are **at the end** of the file,
after the data, each preceded by its marker, and the leading header carries
`grainDirectoryOffset = -1`: a reader with random access has to read the header at
`fileSize - 1024`, not at 0. The file always ends with the `FOOTER` marker, a copy of the header
with the grain directory offset filled in, then the `EOS` marker.

Nothing forces the tables to be at the end: the grain directory offset is explicit, and a reader
that finds a valid one in the leading header does not need the footer.

## The two layouts written by this package

`ConsumerVmdkStreamOptimized` always writes deflate compressed grains and markers: vSphere and
`ovftool` only accept `streamOptimized` for the disks of an OVA. Only the position of the tables and
the calibration of the grains change.

`layout: 'streaming'` (default) is the canonical one: nothing is padded, but the size of the output
is only known once it is fully generated, so the stream carries no `length`.

`layout: 'seekable'` writes the block of tables right after the descriptor, and stores every grain
in a slot of a fixed size:

```
slot = ceil((12 + compressBound(grainSize)) / 512) sectors
compressBound(n) = n + (n >> 12) + (n >> 14) + (n >> 25) + 13
```

that is **129 sectors, 66048 bytes** for a 64KiB grain. 128 is not enough: deflate expands
incompressible data — a random 64KiB grain compresses to about 65562 bytes — and the
`compressedGrains` flag leaves no way to store a grain uncompressed, even a _stored_ deflate block
carries the zlib header and its Adler-32.

The offset of a grain is then `overHead + rank × slot`, where `rank` is the position of the grain
among the allocated ones: the tables only depend on the allocation bitmap, so they can be written
before any data, and the exact size of the file is known in advance:

```
512 + descriptor + tables + nbAllocatedGrains × slot + 3 × 512
```

Such a file can be read back with random access, and also as a stream since all of its metadata
comes before its data. It weights the uncompressed size of its allocated grains, plus 0.78%. In this
layout a grain is written even when it is full of zeros: its slot is reserved either way.

## COWD, the `vmfsSparse` delta of ESXi

Header of 4 sectors:

| Offset | Size | Field                                    |
| -----: | ---: | ---------------------------------------- |
|      0 |    4 | magic `COWD`                             |
|      4 |    4 | version = 1                              |
|      8 |    4 | flags = 3                                |
|     12 |    4 | capacity, in sectors                     |
|     16 |    4 | grain size, in sectors = **1** (512 B)   |
|     20 |    4 | sector offset of the grain directory = 4 |
|     24 |    4 | number of grain directory entries        |
|     28 |    4 | next free sector                         |

The fields past 28 (parent file name, generations) were not used by the previous implementation and
are to be checked against libvmdk before being relied on.

A grain table holds **4096 `uint32` entries**, each the sector offset of a 512 bytes grain, so a
grain table covers exactly **2MiB**. Special values of an entry: `0` the grain is absent and must be
read from the parent, `1` the grain was explicitly zeroed and must **not** be read from the parent.

## SeSparse, the delta of ESXi 6+

Header, 8 bytes entries:

| Offset | Field                                                        |
| -----: | ------------------------------------------------------------ |
|      0 | magic `0xcafebabe`                                           |
|      8 | version = `0x0000000200000001` (2.1)                         |
|     16 | capacity, in sectors                                         |
|     24 | grain size, in sectors = 8 (**4KiB**)                        |
|     32 | size of a grain table, in sectors (× 512 / 8 = 4096 entries) |
|    128 | sector offset of the grain directory                         |
|    136 | size of the grain directory, in sectors                      |
|    144 | sector offset of the grain tables                            |
|    192 | sector offset of the grain area                              |

Unlike the other formats the grain tables are **preallocated but not in order**, they can only be
found through the directory. Directory and table entries are **tagged** `int64`: the top 4 bits hold
the type, the remaining 60 bits an index.

- directory entry: type `0` no table allocated, type `1` allocated, index = number of the table;
- table entry: type `0` grain not allocated (read the parent), `1` unmapped, `2` zero, `3`
  allocated. For type 3 the grain index is rebuilt by swapping two parts of the 60 bits:
  `grainIndex = ((low60 & ones(48)) << 12) | (low60 >> 48)`
  (see <https://lists.gnu.org/archive/html/qemu-block/2019-06/msg00934.html>).

The offset of a grain is `grainAreaOffset + grainIndex × 4096`. One directory entry covers
4096 grains of 4KiB, that is 16MiB.

## Planned reading architecture

Not implemented yet, kept here so that the pieces land consistently.

The disk classes only know the `FileAccessor` interface of `@xen-orchestra/disk-transform` — whose
own documentation already plans for "other accessor, for example in browser or from a vmware
datastore". They take `(accessor, path)`, open the file in `init()`, read through
`accessor.read(fd, buffer, position)` and close in `close()`, like `QCowAccessor` and `RawDisk` do.
Three accessors:

| Accessor            | Backing                        | Notes                                                                                                                      |
| ------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `@xen-orchestra/fs` | a `RemoteHandler`              | already structurally compatible, nothing to write                                                                          |
| stream              | a single `Readable`            | positions must be non decreasing: skip forward, explicit error backwards. One file, so no separate descriptor and no chain |
| browser             | the `File`s attached to a form | `Blob.slice()` + `arrayBuffer()`, sibling files resolved by base name, the write methods of the interface throw            |

The stream accessor requires **all the metadata to come before the data**. That is the case of a
`monolithicSparse`, and of what this package writes with `layout: 'seekable'`. It is _not_ the case
of a stream optimized disk written by ESXi, whose tables are at the end: that one is covered by a
dedicated marker driven sequential reader.

The sources all extend `RandomAccessDisk` and follow the contract of `Disk`: `hasBlock()` describes
**local data only**, `isDifferencing()` tells whether a parent exists, `instantiateParent()` opens
it. The `lookMissingBlockInParent` flag of the previous implementations is replaced by composition
with `DiskChain`.

| Class                 | Block size                 | In memory                                                      | `hasBlock`                                                                              |
| --------------------- | -------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `VmdkStreamOptimized` | grain size from the header | every grain table, like `QcowDisk.init()` loads the L2 tables  | grain table entry ≠ 0                                                                   |
| `VmdkCowd`            | 2MiB, one grain table      | the grain directory only, grain tables are read on demand      | directory entry ≠ 0 — optimistic, an allocated table may only hold grains of the parent |
| `VmdkSeSparse`        | 2MiB, 512 grains           | `Map<blockIndex, Float64Array(512)>` for allocated tables only | the block has at least one grain which is not "read the parent"                         |

2MiB for both deltas is not arbitrary: a chain must have a uniform block size, `DiskChain` returns
the one of its first disk.

Reading a block of a delta means: build the grain map of the block (file offset, zero, or parent),
**merge contiguous file offsets into a single read**, read the parent block once and only if at
least one grain comes from it and the parent chain has that block, zero fill otherwise.

Two entry points: `openVmdk({ accessor, path })` for the disk alone — a delta then reports only its
own data and reads zeros where the parent would answer — and `openVmdkChain({ accessor, path })`
which follows `parentFileNameHint` up to the full disk and returns a `DiskChain`.
