# Glossary

## General

| Acronym | Meaning                 | Definition                                                    |
| ------- | ----------------------- | ------------------------------------------------------------- |
| **CPU** | Central Processing Unit | Processor.                                                    |
| **OS**  | Operating System        | Software environment running on a **VM** or physical machine. |

## Core infrastructure

| Acronym  | Meaning                   | Definition                                                                                                                                           |
| -------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **VM**   | Virtual Machine           | A guest machine (OS + virtual hardware) managed by the pool.                                                                                         |
| **SR**   | Storage Repository        | A storage container (local LVM, NFS, iSCSI, etc.) where **VDIs** live.                                                                               |
| **VDI**  | Virtual Disk Image        | A virtual disk object on an **SR** (root disk, data disk, ISO, snapshot disk, etc.).<br/>Not to be confused with **Virtual Desktop Infrastructure**. |
| **VBD**  | Virtual Block Device      | The attachment that connects a **VDI** to a **VM** (device number, bootable flag, mode).                                                             |
| **VIF**  | Virtual Network Interface | A virtual NIC on a **VM**, connected to a **network**.                                                                                               |
| **PIF**  | Physical Interface        | A physical NIC on a **host**, used for management, storage, or guest networks.                                                                       |
| **PBD**  | Physical Block Device     | Binds an **SR** to a **host** (how the host reaches that storage).                                                                                   |
| **Host** | —                         | A hypervisor server (XCP-ng / XenServer node) in the pool.                                                                                           |
| **Pool** | —                         | A set of **hosts** sharing storage and network configuration.                                                                                        |

## Virtualization modes & hardware

| Acronym          | Meaning                         | Definition                                                                  |
| ---------------- | ------------------------------- | --------------------------------------------------------------------------- |
| **HVM**          | Hardware Virtual Machine        | Full hardware-emulated guest (typical for Windows and many Linux installs). |
| **PV** / **PVM** | Paravirtualization              | Guest uses paravirtualized drivers/interfaces (legacy Linux style on Xen).  |
| **vCPU**         | Virtual CPU                     | A virtual processor presented to the **VM**.                                |
| **GPU**          | Graphics Processing Unit        | Physical graphics hardware on a **host**.                                   |
| **vGPU**         | Virtual GPU                     | A virtual GPU slice assigned to a **VM**.                                   |
| **PGPU**         | Physical GPU                    | A physical GPU as seen by XAPI (grouping / passthrough context).            |
| **VTPM**         | Virtual Trusted Platform Module | Software TPM device exposed to a **VM** (e.g. Windows 11 / BitLocker).      |

## Networking & storage

| Acronym    | Meaning                                  | Definition                                                                    |
| ---------- | ---------------------------------------- | ----------------------------------------------------------------------------- |
| **MTU**    | Maximum Transmission Unit                | Largest Ethernet payload size on a link (e.g. jumbo frames).                  |
| **VLAN**   | Virtual LAN                              | Logical LAN segment; often tied to **PIF** tagging in XAPI.                   |
| **SR-IOV** | Single Root I/O Virtualization           | Passing a virtual function of a physical NIC to a **VM** for near-native I/O. |
| **NFS**    | Network File System                      | File-based **SR** backed by an NFS export.                                    |
| **iSCSI**  | Internet Small Computer System Interface | Block **SR** backed by an iSCSI LUN.                                          |
| **LVM**    | Logical Volume Manager                   | Local volume–style **SR** (e.g. on host disks).                               |
| **ISO SR** | ISO Storage                              | **SR** type used to store `.iso` images for VM install media.                 |

## High availability & resilience

| Acronym | Meaning           | Definition                                                                     |
| ------- | ----------------- | ------------------------------------------------------------------------------ |
| **HA**  | High Availability | Pool feature to restart **VM**s elsewhere if a **host** fails (policy-driven). |

## XCP-ng/Xen Orchestra-specific

| Acronym             | Meaning                 | Definition                                                            |
| ------------------- | ----------------------- | --------------------------------------------------------------------- |
| **XO**              | Xen Orchestra           | The management UI/API stack (`xo-server`, `xo-web`, etc.).            |
| **XOA**             | Xen Orchestra Appliance | Prebuilt VM image that runs **XO** as a packaged appliance.           |
| **XAPI** / **xapi** | Xen API                 | The management API and service on each **host** that **XO** talks to. |
