# XOSAN Requirements

In order to work, XOSAN need a minimal set of requirements.

## Storage

XOSAN can be deployed on an existing **Local LVM storage**, that XenServer configure by default during its installation. However, you can also create yourself easily this kind of storage while using Xen Orchestra:

* Go on the "New" menu entry, then select "Storage"
* Select the host having the disk you want to use for XOSAN
* Select "Local LVM" and enter the path of this disk (e.g: `/dev/sdf`)

> You can discover disks names by issuing `fdisk -l` command on your XenServer host.

> **Recommended hardware:** we don't have specific hardware recommendation regarding hard disks. It could be directly a disk or even a disk exposed via a hardware RAID. Note that RAID mode will influence global speed of XOSAN.

## Network

XOSAN will use the network card you choose at creation. For better performances, a dedicated storage network should be used.

> **Recommended hardware:** 1 Gbit/s network card is the minmum to have decent performances. However, a **10 Gbits/s** network is preferable, especially for a setup using SSDs or more than 2 nodes.

## RAM

Each XOSAN VM will use 2GiB of RAM. It could be increased (sweet spot seems to be around 4GiB), but it's also workload and infrastructure related. If you don't have a lot of RAM, keep it to 2GiB. If RAM is not an issue, 4GiB is better.

## CPU

Each XOSAN VM deployed will use 2x vCPUs. This setting should be enough for all cases.

# Examples

For a 6 nodes setup, XOSAN will use in total:

* 12 vCPUs (usage is in general pretty low)
* 12 GiB RAM
* All Local LVM disk space
