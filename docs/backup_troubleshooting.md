# Backup troubleshooting

## Backup progress

While a backup job is running, you should see activity in the "Tasks" view (Menu/Tasks), like this:

![](assets/export_task.png)

Another good way to check if there is activity is the XOA VM stats view (on the Network graph).

## Error messages

### `VDI chain protection`

> This message is relevant for *Continuous Delta Backup* or *Continuous Replication* only.

It means your previous VM disks and snapshots should be "merged" (*coalesced* in the XenServer world) before we take a new snapshot. This mechanism is handled by XenServer itself, not Xen Orchestra. But we can check your existing VDI chain and avoiding creating more snapshots than your storage can merge. Otherwise, this will lead to catastrophic consequences. Xen Orchestra is the **only** XenServer/XCP backup product dealing with this.

Without this detection, you could have 2 potential issues:

* `The Snapshot Chain is too Long`
* `SR_BACKEND_FAILURE_44 (insufficient space)`

First one is a chain that contains more than 30 elements (fixed XenServer limit), and the other one means it's full because "coalesced" also can't keep up the pace and the storage is filled.

In the end, this message is a **protection mechanism against damaging your SR**. THe backup job will fail but maybe next time it will be run, that chain will be OK.

> You can read more on this into our dedicated blog post regarding [XenServer coalesce detection](https://xen-orchestra.com/blog/xenserver-coalesce-detection-in-xen-orchestra/).

### `SR_BACKEND_FAILURE_44 (insufficient space)`

> This message could be triggered by any backup method.

The Storage Repository (where your VM disks are currently stored) is full. Note that doing a snapshot on a thick provisioned SR (LVM family for all block devices, like iSCSI, HBA or Local LVM) will consume the current disk size. Eg if you are using this kind of SR at more than 50% and you want to backup ALL VM disks on it, you'll hit this wall.

Workarounds:

* use a thin provisioned SR (local ext, NFS, XOSAN)
* wait for Citrix to release thin provisioning on LVM
* wait for Citrix to allow another mechanism than snapshot to be able to export disks
* use less than 50% of SR space or don't backup all VMs

### Could not find the base VM

This message appears when the previous replicated VM has been deleted on the target side which breaks the replication. To reset the process it's necessary to delete VM snapshot related to this CR job on the original VM. The name of this snapshot is: `XO_DELTA_EXPORT: <name label of target SR> (<UUID of target SR>)`
