# Some notes about the conversion
---
## File formats
VMDK and VHD file format share the same high level principles: 

 - sparse format with chunks addressed in a directory
 - a header copied in the footer
 - the address of the directory is in the header/footer
 
There is a major difference: VMDK can, and most often do, compress the 
chunks.

[The VMDK specification](https://www.vmware.com/support/developer/vddk/vmdk_50_technote.pdf)

[A very good help on VMDK](https://github.com/libyal/libvmdk/blob/master/documentation/VMWare%20Virtual%20Disk%20Format%20(VMDK).asciidoc)

[The VHD specification](http://download.microsoft.com/download/f/f/e/ffef50a5-07dd-4cf8-aaa3-442c0673a029/Virtual%20Hard%20Disk%20Format%20Spec_10_18_06.doc)


## StreamOptimized VMDK
The streamOptimized VMDK file format was designed so that from a file on
disk an application can generate a VMDK file going forwards without ever 
needing to seek() backwards. The idea is to:

 - generate a header without a
directory address in it (-1), 
 - dump all the compressed chunks in the stream while generating the 
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

 - it declared having markers in it's header, but there were no marker
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
