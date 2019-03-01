# Metadata backup

> WARNING: Metadata backup is an experimental feature. Restore is not yet available and some unexpected issues may occur.

## Introduction

XCP-ng and Citrix Hypervisor (Xenserver) hosts use a database to store metadata about VMs and their associated resources such as storage and networking. Metadata forms this complete view of all VMs available on your pool. Backing up the metadata of your pool allows you to recover from a physical hardware failure scenario in which you lose your hosts without losing your storage (SAN, NAS...).

In Xen Orchestra, Metadata backup is divided into two different options:

* Pool metadata backup
* XO configuration backup

### How to use metadata backup

In the backup job section, when creating a new backup job, you will now have a choice between backing up VMs and backing up Metadata.
![](https://user-images.githubusercontent.com/21563339/53413921-bd636f00-39cd-11e9-8a3c-d4f893135fa4.png)

When you select Metadata backup, you will have a new backup job screen, letting you choose between a pool metadata backup and an XO configuration backup (or both at the same time):

![](https://user-images.githubusercontent.com/21563339/52416838-d2de2b00-2aea-11e9-8da0-340fcb2767db.png)

Define the name and retention for the job.

![](https://user-images.githubusercontent.com/21563339/52471527-65390a00-2b91-11e9-8019-600a4d9eeafb.png)

Once created, the job is displayed with the other classic jobs.

![](https://user-images.githubusercontent.com/21563339/52416802-c0fc8800-2aea-11e9-8ef0-b0c1bd0e48b8.png)

> Restore for metadata backup jobs should be available in XO 5.33
