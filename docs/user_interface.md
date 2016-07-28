# Administration

This part is about everyday XenServer administration tasks.

## User interface

This section will describe quickly main concepts of Xen Orchestra web interface (`xo-web`).

### Home view

This is home view, what you see when you access your Xen Orchestra URL. It displays all running VMs. This could be configured for your needs (see "Filters section" below).

If you don't have any server connected, you'll see a panel to tell you to add a server:

![](./assets/xo5noserver.png)

#### Add a XenServer host

Just click on "Add server", enter the IP of a XenServer host (ideally the pool master if in a pool):

![](./assets/xo5addserver.png)

After clicking on connect, the server is displayed as connected:

![](./assets/xo5connectedserver.png)

Now go back on Home (or click on the "Xen Orchestra" title on top left of the screen), you'll see the default home view on VMs objects.

#### VMs

This view regroup all **running VMs** on your connected server:

![](./assets/xo5homevms.png)

Let's take a quick tour:

* the global menu is on the left, you can collapse it by clicking on the icon ![](./assets/xo5collapsemenu.png)
* the home view got a header with a type selector (VMs, hosts or pools), a filter zone and a button to create a new VMs
* the VM list also got a header (number of filtered VMs on total VMs) and assisted filters (by pool, host and tags) and a sort menu (by name, memory etc.). You can also expand all VMs details here with the icon ![](./assets/xo5expandhome.png)

> Pro Tip: you can edit a VM name, description and even current host by doing a long click on it

##### Bulk actions

You can select multiple objects (eg VMs) at once to make bulk action. The master checkbox will select all, or you can pick anything yourself.

After selecting one or more object, an action bar is displayed:

![](./assets/xo5bulk.png)

This will execute action for all those objects!

#### Hosts

All host objects are displayed:

![](./assets/xo5host.png)

You have power status, name, description, number of CPU core, total memory, management IP and pool name displayed. You can also edit those with a long click.

> Pro Tip: if some hosts had missing patches, you'll see a red dot with the total patches to install. Click on it to go the patch section of the host. See this blog post on [patches for XenServer](https://xen-orchestra.com/blog/hotfix-xs70e004-for-xenserver-7-0/) for more details.

#### Pools

All your pools are displayed here:

![](./assets/xo5pool.png)

You can also see missing patches in red.

> Did you know? Even a single XenServer host is inside a pool!

### Live filter search

The idea is not just to provide a good search engine, but also a complete solution for managing all your XenServer infrastructure. Ideally:

* less clicks to see or make what you want
* find a subset of interesting object
* make bulk actions on all results found
* sort your result for more pertinent insight

> Pro Tip: the URL of Xen Orchestra contains the search string, eg `home?s=power_state%3Arunning+`. You can share those URL to your colleagues to share your search!

#### Search examples

We recorded some filters in the dropdown "Filters":

![](./assets/xo5presetfilter.png)

You can also use other filters here:

![](./assets/xo5presetfilter2.png)

#### Save your search

If you want to record your filter, just click on "Save" icon ![](./assets/xo5savefilter.png)

After giving a name to your filter, you can find it in the dropdown filter menu.

#### Manage your saved search

Just go in your user zone (bottom of main left menu):

![](./assets/xo5usericon.png)

There, you can edit or remove any filter/search your created!

#### Make a default search

In this user zone, you can set a default filter (preset filters or your own).

> Pro Tip: this is saved in your user preference. It means that you can connect anywhere on any browser, you'll find your preference.


### Easy VM creation

Creating a VM should be trivial! That's why we are constantly improving our interface to display only what's necessary, but also allow the user to access advanced stuff when needed.

Be advised we are in the middle of a full interface rewrite, you can read [more about it here](https://xen-orchestra.com/blog/announcing-xen-orchestra-5-x/).

### Change de default SR

In XenServer, the default SR (Storage Repository) is where your VDIs are stored by default.

It's very useful for a lot of things, avoiding the user to configure itself for each operation.

Just go inside your pool view, you'll have a list of your SRs. Just click on the "disk" icon at the end of the line corresponding to the SR you want to be the new default one:

![](https://xen-orchestra.com/blog/content/images/2015/12/setdefaultsr.png)

### VM import and export

You can import or export a VM directly on your computer, through your web browser.

If your VM is currently running, XO will automatically create a snapshot then delete it at the end of the export process.

[![](https://xen-orchestra.com/blog/content/images/2014/Sep/import1bis.png)](https://xen-orchestra.com/blog/import-and-export-vm-in-xo/)

### VM Copy

VM copy allow to make an export and an import in streaming. You can target any SR in your whole XenServer infrastructure (even across different pools!)

![](https://xen-orchestra.com/blog/content/images/2015/11/vmcopy.png)

### Snapshots management

You can create a snapshot in one click. It will be named automatically. After the snapshot is created, you can either:

* export it on your computer
* revert your VM to this snapshot (it will restart the VM)
* delete this snapshot


[![](https://xen-orchestra.com/blog/content/images/2014/Nov/snap2.png)
](https://xen-orchestra.com/blog/snapshot-export-with-xen-orchestra/)

> By default, XOA will try to make a snapshot with quiesce. If the VM do not support it, it will fallback to the default snapshot system.

If your snapshot was done with quiesce support, you'll see a icon:

![](https://xen-orchestra.com/blog/content/images/2015/11/quiesce2.png)

### Statistics

Live statistics are showing the last 10 minutes of VM/host/SR usage.


[![](https://xen-orchestra.com/blog/content/images/2015/04/statsI.png)
](https://xen-orchestra.com/blog/vm-live-metrics-in-xenserver-with-xen-orchestra/)

### Auto patching

Patching a host manually could be time consuming (and boring). That's why we provide a high level feature downloading and applying all missong patches automatically.

[![](https://xen-orchestra.com/blog/content/images/2015/10/patch_all.png)
](https://xen-orchestra.com/blog/xen-orchestra-4-8/#fullyautomatedpatching)

> If you are behind a proxy, please update your `xo-server` configuration to add a proxy server, as [explained in the appropriate section](configuration.md#proxy-for-xenserver-updates-and-patches).


### Batch operations

You can make simultaneous operations on many objects: like migrate a bunch of VM, or start them at the same time. For this, you can select multiple VMs at the same time (in the home view), then apply actions on it thanks to the "action" bar on the top.

Please consider that booting a lot of VM at the same time could be longer than doing it per smaller batches.

### Drag'n drop live migration

You can live migrate a VM just by drag'n drop! But also select multiple VM and migrate them at the same time on a targeted host.


[![](https://xen-orchestra.com/blog/content/images/2015/06/dragndrop.png)
](https://xen-orchestra.com/blog/vm-live-migration-with-xenserver-and-xen-orchestra/)

### VDI live migration

Thanks to Xen Storage Motion, it's easy to move a VM disk from a storage to another, while the VM is on! This feature can help you to migrate from your local storage to a SAN, or just upgrade your SAN without any downtime.

To do that: go inside your running VM, then edit the Disk panel. You can change the SR of any disk, then save. This will trigger the storage motion.


[![](https://xen-orchestra.com/blog/content/images/2015/01/vdi3.png)
](https://xen-orchestra.com/blog/moving-vdi-in-live/)

#### Offline VDI migration

Despite it's not currently supported in XenServer, we managed to do it in Xen Orchestra. It's exactly the same process than for a running VM. Read this article for more details: https://xen-orchestra.com/blog/moving-a-vdi-offline-in-xenserver/


### VM recovery

![](https://cloud.githubusercontent.com/assets/1241401/11213395/21178820-8d3c-11e5-8f7f-8767afe0f129.png)

This button will allow you to boot directly on the CD drive, ignoring your current disks. Note that it works for all virtualization modes: HVM or PV.

### Host emergency shutdown

In the host view, you have a "Emergency shutdown" button:

![](https://xen-orchestra.com/blog/content/images/2015/11/emergency_button.png)

This will:

1. Suspend all your running VM on your host
2. Shutdown it

This is particularly useful for power outage on a limited UPS battery time.

> Suspending VMs will avoid any data loss, even if they are stored in RAM!

### Adjusting resources in live

You can edit your VM RAM or CPUs in live, like you edit a VM name or description. But there is some XenServer limitations and configuration not exposed directly in Xen Orchestra:

* each VM has a vCPU maximum number. This value can't be change while the VM is running. You can reduce the number of vCPUs, but can't assign more than max. In XO, while your VM is halted, allow the max vCPUs you would need, then boot it. Now you can reduce it and then expand it later to this maximum.
* the same limitation apply for the RAM.

You can learn more about XenServer resource management here: https://wiki.xenserver.org/XCP_FAQ_Dynamic_Memory_Control

### Auto power VM

Activate "Auto Power" on a VM will also configure the pool accordingly. [Read our blog post for further detail](/blog/auto-start-vm-on-xenserver-boot/).

![](https://xen-orchestra.com/blog/content/images/2015/11/autopoweron.png)

### Docker management

> Please [read the dedicated section](docker_support.md) to install a Docker Ready VM.

Thanks to the plugin developed [recently](http://xenserver.org/partners/docker.html?id=159) as a "preview" by Citrix in XenServer, we started to work something to expose those data in Xen Orchestra.

First thing first, we now detect which VMs are "Docker ready", meaning connected to XenServer and its plugin to send more info.

This is visible in the home page of XO, VM with a small ship blue logo:

![](https://xen-orchestra.com/blog/content/images/2015/05/docker.png)

By clicking on this VM, you'll have some new stuff visible, first the Docker version:

![](https://xen-orchestra.com/blog/content/images/2015/05/docker2.png)

Also, a new panel is now displaying the containers on the VM:

![](https://xen-orchestra.com/blog/content/images/2015/05/docker3.png)

You can Stop, Start, Pause, Resume or Restart a Docker container from there.

### VM CPU priority

You can change the CPU Weight in the VM view. Values are:

* Default
* Quarter (1/4)
* Half (1/2)
* Normal
* Double (x2)

![](./assets/cpu_weight.png)

By default, each VM has a weight of 256.

If one VM got for example, "Double", it will have double priority for the Xen scheduler. [Read more on the official Citrix XenServer documentation](http://support.citrix.com/article/CTX117960).
