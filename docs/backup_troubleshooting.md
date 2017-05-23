# Backup troubleshooting

## Backup progress

While a backup job is running, you should see activity in the "Task" view (Menu/Tasks), like this:

![](assets/export_task.png)

Another good way to check if there is activty is the XOA VM stats view (on the Network graph).

## Error messages

### `unhealthy VDI chain`

> This message is relevent for Continuous Delta Backup or Continuous Replication only.

It means your previous VM disks and snapshots should be "merged" (*coalesced* in the XenServer world) before we take a new snapshot. This mechanism is handled by XenServer itself, not us. But we can check your existing chain and avoiding creating more snapshot than your storage can merge.

Without this detection, you could have 2 potential issues:

* `The Snapshot Chain is too Long`
* `SR_BACKEND_FAILURE_44 (insufficient space)`

First one is a chain that contains more than 30 elements (fixed XenServer limit), and the other one means it's full because "coalesced" can't keep up the pace too and the disk is filled.

So in the end, this message is a **protection mechanism against damaging your SR**. THe backup job will fail but maybe next time it will be run, that chain will be OK.

### `SR_BACKEND_FAILURE_44 (insufficient space)`

> This message could be triggered by any backup method.

The Storage Repository (where your VM disks are currently stored) is full. Note that doing a snapshot on a thick provisioned SR (LVM family for all block devices, like iSCSI, HBA or Local LVM) will consume the current disk size. Eg if you are using this kind of SR at more than 50% and you want to backup ALL VM disks on it, you'll hit this wall.

Workarounds:

* use a thin provisioned SR (local ext, NFS, XOSAN)
* wait for Citrix to release thin provisioning on LVM
* wait for Citrix to allow another mechanism than snapshot to be able to export disks
* use less than 50% of SR space or don't backup all VMs
