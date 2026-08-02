# Glossary

## General

| Term    | Meaning                 | Definition                                                    |
| ------- | ----------------------- | ------------------------------------------------------------- |
| **CPU** | Central Processing Unit | Processor.                                                    |
| **OS**  | Operating System        | Software environment running on a **VM** or physical machine. |

## Core infrastructure

| Term            | Meaning                   | Definition                                                                                                                                           |
| --------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dom0**        | Control domain            | The privileged Linux VM started with each **host**: it runs XAPI and the storage/network drivers. Its resources are shared by all operations on the host. |
| **Host**        |                           | A hypervisor server (XCP-ng / XenServer node) in the pool.                                                                                           |
| **PBD**         | Physical Block Device     | Binds an **SR** to a **host** (how the host reaches that storage).                                                                                   |
| **PIF**         | Physical Interface        | A physical NIC on a **host**, used for management, storage, or guest networks.                                                                       |
| **Pool**        |                           | A set of **hosts** sharing storage and network configuration.                                                                                        |
| **Pool master** |                           | The **host** that coordinates the **pool** and exposes its XAPI: XO always talks to the pool through its master.                                     |
| **SR**          | Storage Repository        | A storage container (local LVM, NFS, iSCSI, etc.) where **VDIs** live. Not to be confused with a backup repository (**BR**).                         |
| **VBD**         | Virtual Block Device      | The attachment that connects a **VDI** to a **VM** (device number, bootable flag, mode).                                                             |
| **VDI**         | Virtual Disk Image        | A virtual disk object on an **SR** (root disk, data disk, ISO, snapshot disk, etc.).<br/>Not to be confused with **Virtual Desktop Infrastructure**. |
| **VIF**         | Virtual Network Interface | A virtual NIC on a **VM**, connected to a **network**.                                                                                               |
| **VM**          | Virtual Machine           | A guest machine (OS + virtual hardware) managed by the pool.                                                                                         |

## Virtualization modes & hardware

| Term             | Meaning                         | Definition                                                                  |
| ---------------- | ------------------------------- | --------------------------------------------------------------------------- |
| **GPU**          | Graphics Processing Unit        | Physical graphics hardware on a **host**.                                   |
| **HVM**          | Hardware Virtual Machine        | Full hardware-emulated guest (typical for Windows and many Linux installs). |
| **PGPU**         | Physical GPU                    | A physical GPU as seen by XAPI (grouping / passthrough context).            |
| **PV** / **PVM** | Paravirtualization              | Guest uses paravirtualized drivers/interfaces (legacy Linux style on Xen).  |
| **vCPU**         | Virtual CPU                     | A virtual processor presented to the **VM**.                                |
| **vGPU**         | Virtual GPU                     | A virtual GPU slice assigned to a **VM**.                                   |
| **VTPM**         | Virtual Trusted Platform Module | Software TPM device exposed to a **VM** (e.g. Windows 11 / BitLocker).      |

## Networking & storage

| Term              | Meaning                                  | Definition                                                                                                                       |
| ----------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **iSCSI**         | Internet Small Computer System Interface | Block **SR** backed by an iSCSI LUN.                                                                                             |
| **ISO SR**        | ISO Storage                              | **SR** type used to store `.iso` images for VM install media.                                                                    |
| **LVM**           | Logical Volume Manager                   | Local volume-style **SR** (e.g. on host disks).                                                                                  |
| **MTU**           | Maximum Transmission Unit                | Largest Ethernet payload size on a link (e.g. jumbo frames).                                                                     |
| **NBD**           | Network Block Device                     | Protocol XO uses to read disk data directly from hosts, for faster [NBD-enabled backups](xo5/incremental_backups.md#nbd-enabled-backups). Required for incremental backups of QCOW2 disks. |
| **NFS**           | Network File System                      | File-based **SR** backed by an NFS export.                                                                                       |
| **QCOW2**         | QEMU Copy On Write v2                    | Disk format lifting the 2 TiB **VHD** limit (up to 16 TiB per disk), generally available since XO 6.5 and recent XCP-ng releases. |
| **SR-IOV**        | Single Root I/O Virtualization           | Passing a virtual function of a physical NIC to a **VM** for near-native I/O.                                                    |
| **Traffic rules** |                                          | Firewall-like rules applied to networks and **VIFs** through the [SDN controller](xo5/sdn_controller.md).                        |
| **VHD**           | Virtual Hard Disk                        | Historical disk and backup format of the platform, limited to 2 TiB per disk (see **QCOW2**).                                    |
| **VLAN**          | Virtual LAN                              | Logical LAN segment; often tied to **PIF** tagging in XAPI.                                                                      |
| **XVA**           | XenServer Virtual Appliance              | Archive format for a complete VM export, used by [full backups](full_backups.md).                                            |

## High availability & operations

| Term    | Meaning             | Definition                                                                                                                                    |
| ------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **HA**  | High Availability   | Pool feature to restart **VM**s elsewhere if a **host** fails (policy-driven).                                                                |
| **RPU** | Rolling Pool Update | XO-orchestrated [update of a whole pool](xo5/manage_infrastructure.md#rolling-pool-updates-rpu): hosts are patched and rebooted one by one while VMs are live migrated, with no VM downtime. |

## Backup & replication

| Term                       | Meaning                        | Definition                                                                                                                                          |
| -------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **BR**                     | Backup Repository              | Storage where XO writes backups (NFS, SMB, S3, local...), formerly called a "remote". See [backup repositories](xo5/backups.md#remotes).            |
| **CBT**                    | Changed Block Tracking         | XCP-ng/XenServer feature letting XO [purge snapshot data](xo5/incremental_backups.md#purge-snapshot-data-cbt): the reference snapshot keeps only small metadata on the **SR**. |
| **Coalesce**               |                                | The storage process merging a VDI chain after a snapshot is deleted. Backups create and delete snapshots, so [coalesce health](xo5/backup_troubleshooting.md) directly affects them. |
| **CR**                     | Incremental replication        | Regularly replays deltas of a VM to an **SR** on another pool or host, formerly "continuous replication". See [incremental replication](xo5/incremental_replication.md). |
| **DR**                     | Full replication               | Regularly streams a full copy of a VM to an **SR** on another pool or host, formerly "disaster recovery". See [full replication](full_replication.md). |
| **Full backup interval**   |                                | Also called [key backup interval](xo5/incremental_backups.md#key-backup-interval): forces a periodic new full (key) backup in an incremental backup job. |
| **GFS**                    | Grandfather-Father-Son         | [Long-term retention strategy](xo5/backups.md#long-term-backup-retention-with-gfs-strategy) keeping daily, weekly, monthly and yearly backups.       |
| **Health check**           |                                | Automatic [restore test](xo5/backups.md#backup-health-check) after a backup: XO boots the restored VM to verify the backup is actually usable.       |
| **Immutability**           |                                | Protection making backups [unmodifiable for a configured duration](immutability.md), even by XO itself (ransomware protection).                  |
| **Mirror backup**          |                                | A [backup of your backups](mirror_backup.md): copies the archives of one **BR** to another, the key to 3-2-1 strategies.                         |
| **[NOBAK]**                |                                | Marker added to a **VDI** name to [exclude that disk](xo5/backups.md#exclude-disks) from all backup jobs.                                            |
| **Rolling snapshot**       |                                | Scheduled [automatic snapshots](rolling_snapshots.md) with retention. Snapshots live on the same **SR** as the VM: not a real backup.            |
| **Sequence**               |                                | [Chains backup schedules](xo5/backups.md#sequences) so they run one after the other instead of competing in parallel.                                |
| **Smart backup**           |                                | [Selects VMs by criteria](xo5/backups.md#smart-backup) (pool, tags, power state) resolved at job runtime, instead of a fixed VM list.                |

## XCP-ng/Xen Orchestra-specific

| Term                | Meaning                 | Definition                                                                                                                                        |
| ------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Guest tools**     |                         | Drivers and agent [installed inside a VM](https://xcp-ng.org/docs/guests.html): they report the IP address and metrics, and enable clean shutdown and migration. |
| **V2V**             | Virtual to Virtual      | Built-in [migration tool](xo5/v2v-migration-guide.md) importing VMs directly from VMware/ESXi to XCP-ng.                                          |
| **XAPI** / **xapi** | Xen API                 | The management API and service on each **host** that **XO** talks to.                                                                             |
| **XCP-ng**          |                         | The open source, Xen-based hypervisor [managed by XO](supported_hosts.md), developed by Vates alongside Xen Orchestra.                            |
| **XO**              | Xen Orchestra           | The management UI/API stack (`xo-server`, `xo-web`, etc.).                                                                                        |
| **XO 5** / **XO 6** |                         | The two web interfaces served by the same XO backend: XO 6 is the current default, XO 5 the previous generation. See [XO 6 vs XO 5](xo6/xo6vsxo5.md). |
| **XO Lite**         |                         | [Lightweight web UI](https://docs.vates.tech/products/add-ons/xo-lite) embedded in every XCP-ng host (8.3+): basic management and XOA deployment, no installation needed. |
| **XO Proxy**        |                         | [Component deployed close to remote infrastructure](xo5/proxy.md) to run backups locally, without streaming all data through the main XOA.        |
| **XOA**             | Xen Orchestra Appliance | Prebuilt VM image that runs **XO** as a packaged appliance.                                                                                       |
