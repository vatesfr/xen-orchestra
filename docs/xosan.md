# XOSAN

XOSAN is a virtual SAN that allows you to create a shared SR (Storage Repository) by combining your existing local SRs. It's a software defined and hyperconverged solution for XenServer.

![](https://xen-orchestra.com/blog/content/images/2016/12/XOSANpool.jpg)

## Introduction

This documentation will give you some advices and assistance in order to create a XOSAN storage on your XenServer infrastructure.

## Objectives

XOSAN will "gather" all your local disks into a shared SR, that XenServer will just see as any other shared SR, without limitations on it (you can live migrate, snapshot, backup, whatever you need). **It's a fully software defined solution** that doesn't require to buy extra-hardware. It could even run on the disk where your XenServer is already installed!

![](https://xen-orchestra.com/blog/content/images/2016/12/hyperpool.jpg)

The objectives are to:

* protect your data thanks to replication of data on multiple hosts
* provide XenServer high availability without buying a NAS nor a SAN
* give you flexibility to grow your storage by adding new nodes
* work on all kind of hardware, from HDDs to SSDs, with hardware RAID or not

## Beta access - Phase II

XOSAN is currently in beta phase II. Every user can access this beta stage and try the solution in its current version.
To activate you XOSAN beta, just go in the **"XOSAN"** menu in your (up-to-date) XOA. Once on the menu, click on **"Register for Beta"**.

![](https://xen-orchestra.com/blog/content/images/2017/02/xosan-menu.png)

> Even a free version of XOA can access the XOSAN beta.

## Deployment

To deploy XOSAN, please follow the rest of the documentation:

* [XOSAN Requirements](xosan_requirements.md)
* [Types of XOSAN](xosan_types.md)
* [How to create a new XOSAN Storage](xosan_create.md)
* [XOSAN management](xosan_management.md)
* [Get a free XOSAN trial](xosan_trial.md)
