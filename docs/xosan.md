# XOSAN

XOSAN is a virtual SAN that allows you to create a shared SR (Storage Repository) by combining your existing local SRs. It's a software defined and hyperconverged solution for XenServer.

![](https://xen-orchestra.com/blog/content/images/2016/12/XOSANpool.jpg)

## Introduction

This documentation will give you some advice and assistance in order to create an XOSAN storage on your XenServer or XCP-ng infrastructure.

## Objectives

XOSAN will "gather" all your local disks (across multiple hosts) into a shared SR, that XenServer/XCP-ng will just see as any other shared SR, without limitations (you can live migrate, snapshot, backup, whatever you need). **It's a fully software defined solution** that doesn't require you to buy extra hardware. It can even run on the disk where your Citrix Hypervisor (Xenserver) or XCP-ng is already installed!

![](https://xen-orchestra.com/blog/content/images/2016/12/hyperpool.jpg)

The objectives are to:

- protect your data thanks to replication of data across multiple hosts
- Unlock High Availability without buying a NAS nor a SAN
- give you flexibility to grow your storage by adding new nodes
- work on all kinds of hardware, HDDs or SSDs, with hardware RAID or not

## Deployment

To deploy XOSAN, please follow the rest of the documentation:

- [XOSAN Requirements](xosan_requirements.md)
- [Types of XOSAN](xosan_types.md)
- [How to create a new XOSAN Storage](xosan_create.md)
- [XOSAN management](xosan_management.md)
- [Get a free XOSAN trial](xosan_trial.md)
