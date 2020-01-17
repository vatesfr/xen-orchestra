# Some notes about the conversion

## File formats

VMDK and VHD file format share the same high level principles:

- sparse format with chunks addressed in a directory
- a header copied in the footer
- the address of the directory is in the header/footer

There is a major difference: VMDK can, and most often do, compress the
chunks.

[The VMDK specification](https://www.vmware.com/support/developer/vddk/vmdk_50_technote.pdf)

[A very good help on VMDK](<https://github.com/libyal/libvmdk/blob/master/documentation/VMWare%20Virtual%20Disk%20Format%20(VMDK).asciidoc>)

[The VHD specification](http://download.microsoft.com/download/f/f/e/ffef50a5-07dd-4cf8-aaa3-442c0673a029/Virtual%20Hard%20Disk%20Format%20Spec_10_18_06.doc)

## A primer on VMDK

A VMDK file might contain more than one logical disk inside (sparse extent), a ascii header describes those disks.

Each sparse extent contains "grains", whose address is designated into a "grain table". Said table is itself indexed by a "directory".
The grain table is not sparse, so the directory is useless (historical artifact).

### StreamOptimized VMDK

The streamOptimized VMDK file format was designed so that from a file on
disk an application can generate a VMDK file going forwards without ever
needing to seek() backwards. The difference is that header, tables, directory, grains etc. are delimited by "markers"
and the table and directory are pushed at the end of the file and the grains are compressed.

The generation algorithm is:

- generate a header without a
  directory address in it (-1),
- dump all the compressed grains in the stream while generating the
  directory in memory
- dump the directory marker
- dump the directory and record its position
- dump the fine directory marker
- dump the fine directory
- dump the footer marker
- dump the footer, with the directory address previously recorded
- dump the end of file marker

All the files found on the internet had their chunks in ascending
position order, which was our assumption all along.

We see that (with an exception below) we'll find the directory at the
end of the file, preventing us from pre-computing the output file
topology.

The markers are here to help decoding the VMDK file from a stream
without seek(). This is not really possible for us because the VHD file
format requires the directory address to be set in the header, and said
address is not known until the end of the file.

## Variable topology

The directory can be anywhere in a VMDK or VHD file, but it will most
often be either at the top or at the bottom, ie before or after the
chunks.

Since we can't pre-compute the topology with a directory at the
bottom and variable size chunks, nor seek(), nor editing the
output VHD file(and the VHD format requires the directory address to be
in the header), and the chunks are in ascending order of position
everywhere we looked at, we decided to generate a raw VHD output file.

A raw VHD disk consists of a dense image of the disk followed by a
footer, without any directory or chunking involved

### A Strange file

When scouring the internet for test files, we stumbled on [a strange OVA file](http://blog.waldrondigital.com/2012/09/23/zoneminder-virtual-machine-appliance-for-vmware-esxi-workstation-fusion/).
The VMDK contained in the OVA (which is a tar of various files), had a
few oddities:

- it declared having markers in its header, but there were no marker
  for its primary and secondary directory, nor for its footer
- its directories are at the top, and declared in the header.
- it declared being streamOptimized

The absence of markers lead us to add code for reading and
skipping the directories when they are at the beginning. This
opportunity could be leveraged to actually generate a sparse output
file.

## Disk geometry

### Converted geometry

Some VMDK files have a geometry declared as 0/0/0, a new geometry is
created in the output file according the VHD specification.

### Geometry size vs. declared size

For their inner working some applications will compute a disk size from
the geometry while others will simply read the size from the appropriate
header. This can cause some misunderstanding when converting a file from
one application an other.

### Stream length

The VHD stream doesn't declare its length, because that breaks the
downstream computation in xo-server, but with a fixed VHD file format,
we can pre-compute the exact file length and advertise it.

# The conversion from VMDK to VHD

In the browser we extract the grain table, that is a list of the file offset of all the grains and a list of the
logical address of all the grains (both lists are in the increasing offset order with matching indexes, we use to lists
for bandwidth reason). Those lists are sent to the server, where the VHD Block Allocation Table will be generated.
With the default parameters, there are 32 VMDK grains into a VHD block, so a late scheduling is used to create the BAT.

Once the BAT is generated, the VHD file is created on the fly block by block and sent on the socket towards the XAPI url.

## How VHD Block order and position is decided from the VMDK table

Let use letters to represent VHD Blocks, and number to represent their smaller VMDK constituents, and a ratio of 3 VMDK
fragment per VHD block.

`A` is the first VHD block, `A2` is the second VMDK fragment of the first VHD block.

In the VMDK file, fragments could be in any order and VHD blocks might not even be complete: `A3 E3 C1 C2 C3 A1 A2`.
We are trying to generate a VHD file while using the minimum intermediate memory possible.

When generating the VHD file Block Allocation Table we are setting in stone the order in which the block will be sent in
the VHD stream. Since we can't seek backwards in the VHD stream, we can't write a VHD block until all its VMDK fragments
have been read, so the last fragment encountered will dictate the order of the VHD Block in the file.

Let's review our previous example: `A3 E3 C1 C2 C3 A1 A2`, the block `B` doesn't appear, the block `A` has its fragment
interleaved with other blocks. So to decide the order of the blocks in the VHD file, we just go backwards and the last
time we see a block we can write it, the result of this backward collection is `A C E`:

- `A2` seen, collect `A`
- `A1` seen, skip because we already have A
- `C3` seen, collect `C`
- `C2` seen, skip
- `C1` seen, skip
- `E3` seen, collect `E`
- `A3` seen, skip (but we can infer how long we'll need to keep this fragment in memory).

We can now reverse our collection to `E C A`, and attribute addresses to the blocks, we could not do it before, because
we didn't know that `B` didn't exist or that `E` would be the first one.

When reading the VMDK file, we know that when we encounter `A3` we will have to keep it in memory until we meet `A2`.
But when we meet `E3`, we know that we can dump `E` on the VHD stream and release the memory for `E`.
