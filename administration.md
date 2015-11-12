# Administration

This part is about everyday XenServer administration tasks.

### Infrastructure overview

The original motivation of XO was to provide a view to understand the whole infrastructure in a single page. In short, to answer the question: "where is my VM?".


[![](https://xen-orchestra.com/blog/content/images/2014/Aug/main_view.png)](https://xen-orchestra.com/blog/introducing-new-interface/#horizontalhierarchy).

### Live filter search

If you infrastructure starts to be big, it could be useful to find exactly what you need. It could be an IP address, a VM name, or a storage name: any object!


[![](https://xen-orchestra.com/blog/content/images/2014/Aug/flat_view_filtered.png)](https://xen-orchestra.com/blog/introducing-new-interface/#flatviewwithpowerfulsearchengine).

### Easy VM creation

Creating a VM should be trivial! That's why we are constantly improving our interface to display only what's necessary, but also allow the user to access advanced stuff when needed.

Be advised we are in the middle of a full interface rewrite, you can read [more about it here](https://xen-orchestra.com/blog/announcing-xen-orchestra-5-x/).

### VM import and export

You can import or export a VM directly on your computer, through your web browser.

If your VM is currently running, XO will automatically create a snapshot then delete it at the end of the export process.

[![](https://xen-orchestra.com/blog/content/images/2014/Sep/import1bis.png)](https://xen-orchestra.com/blog/import-and-export-vm-in-xo/).

### VM Copy

VM copy allow to make an export and an import in streaming. You can target any SR in your whole XenServer infrastructure (even across different pools!)

![](https://xen-orchestra.com/blog/content/images/2015/11/vmcopy.png)

### Snapshots management

You can create a snapshot in one click. It will be named automatically. After the snapshot is created, you can either:

* export it on your computer
* revert your VM to this snapshot (it will restart the VM)
* delete this snapshot


[![](https://xen-orchestra.com/blog/content/images/2014/Nov/snap2.png)
](https://xen-orchestra.com/blog/snapshot-export-with-xen-orchestra/).

### Statistics

Live statistics are showing the last 10 minutes of VM/host/SR usage.


[![](https://xen-orchestra.com/blog/content/images/2015/04/statsI.png)
](https://xen-orchestra.com/blog/vm-live-metrics-in-xenserver-with-xen-orchestra/).

### Auto patching

Patching a host manually could be time consuming (and boring). That's why we provide a high level feature downloading and applying all missong patches automatically.

[![](https://xen-orchestra.com/blog/content/images/2015/10/patch_all.png)
](https://xen-orchestra.com/blog/xen-orchestra-4-8/#fullyautomatedpatching).

### Batch operations

You can make simultaneous operations on many objects: like migrate a bunch of VM, or start them at the same time. For this, you can select multiple VMs at the same time (in the home view), then apply actions on it thanks to the "action" bar on the top.

Please consider that booting a lot of VM at the same time could be longer than doing it per smaller batches.

### Drag'n drop live migration

You can live migrate a VM just by drag'n drop! But also select multiple VM and migrate them at the same time on a targeted host.


[![](https://xen-orchestra.com/blog/content/images/2015/06/dragndrop.png)
](https://xen-orchestra.com/blog/vm-live-migration-with-xenserver-and-xen-orchestra/).

### VDI live migration

Thanks to Xen Storage Motion, it's easy to move a VM disk from a storage to another, while the VM is on! This feature can help you to migrate from your local storage to a SAN, or just upgrade your SAN without any downtime.

To do that: go inside your running VM, then edit the Disk panel. You can change the SR of any disk, then save. This will trigger the storage motion.


[![](https://xen-orchestra.com/blog/content/images/2015/01/vdi3.png)
](https://xen-orchestra.com/blog/moving-vdi-in-live/).

### Adjusting resources in live

You can edit your VM RAM or CPUs in live, like you edit a VM name or description. But there is some XenServer limitations and configuration not exposed directly in Xen Orchestra:

* each VM has a vCPU maximum number. This value can't be change while the VM is running. You can reduce the number of vCPUs, but can't assign more than max. In XO, while your VM is halted, allow the max vCPUs you would need, then boot it. Now you can reduce it and then expand it later to this maximum.
* the same limitation apply for the RAM.

You can learn more about XenServer resource management here: https://wiki.xenserver.org/XCP_FAQ_Dynamic_Memory_Control