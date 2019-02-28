# Metadata backup

> WARNING: Metadata backup is an experimental feature. Restore is not yet available and some unexpected issue can occur.

## Introduction

XCP-ng and Citrix Hypervisor (Xenserver) hosts use a database to store metadata about VMs and their associated resources as storage and networking. Metadata forms this complete view of all VMs available on your pool. Backup the metadata of your pool allow you to recover from a physical hardware failure scenario in which you lose your hosts without loosing your storage (SAN, NAS...).

In Xen Orchestra, Metadata backup is divided in two differents options:

* Pool metadata backup
* XO configuration backup

### How to use metadata backup

In the backup job section, when creating a new backup job, you will now have the option between backup VMs and Backup Metadata.
![](https://user-images.githubusercontent.com/21563339/53413921-bd636f00-39cd-11e9-8a3c-d4f893135fa4.png)

When you select Metadata backup, you will have a new backup job screen, letting you choose between a pool metadata backup and a XO configuration backup (or both at the same time):

![](https://user-images.githubusercontent.com/21563339/52416838-d2de2b00-2aea-11e9-8da0-340fcb2767db.png)

Define name and retention for the job.

![](https://user-images.githubusercontent.com/21563339/52471527-65390a00-2b91-11e9-8019-600a4d9eeafb.png)

Once created, the job is display with the other classic jobs.

![](https://user-images.githubusercontent.com/21563339/52416802-c0fc8800-2aea-11e9-8ef0-b0c1bd0e48b8.png)

> Restore for metadata backup job should be available in XO 5.33
