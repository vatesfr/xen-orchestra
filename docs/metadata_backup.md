# Metadata backup

XCP-ng and Citrix Hypervisor (Xenserver) hosts use a database to store metadata about VMs and their associated resources such as storage and networking. Metadata forms this complete view of all VMs available on your pool. Backing up the metadata of your pool allows you to recover from a physical hardware failure scenario in which you lose your hosts without losing your storage (SAN, NAS...).

In Xen Orchestra, Metadata backup is divided into two different options:

- Pool metadata backup
- XO configuration backup

## Performing a backup

In the backup job section, when creating a new backup job, you will now have a choice between backing up VMs and backing up Metadata:
![](./assets/metadata-1.png)

When you select Metadata backup, you will have a new backup job screen, letting you choose between a pool metadata backup and an XO configuration backup (or both at the same time):

![](./assets/metadata-2.png)

Define the name and retention for the job.

![](./assets/metadata-3.png)

Once created, the job is displayed with the other classic jobs.

![](./assets/metadata-4.png)

## Performing a restore

:::warning
Restoring pool metadata completely overwrites the XAPI database of a host. Only perform a metadata restore if it is a new server with nothing running on it (eg replacing a host with new hardware).
:::

If you browse to the Backup NG Restore panel, you will now notice a Metadata filter button:

![](./assets/metadata-5.png)

If you click this button, it will show you Metadata backups available for restore:

![](./assets/metadata-6.png)

You can see both our Xen Orchestra config backup, and our pool metadata backup. To restore one, simply click the blue restore arrow, choose a backup date to restore, and click OK:

![](./assets/metadata-7.png)

That's it!
