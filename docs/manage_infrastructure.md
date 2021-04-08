# Infrastructure management

This section is related on how to manage your XCP-ng/Citrix Hypervisor infrastructure.

## Home view

The home view is what you see when you access your Xen Orchestra URL. It displays all running VMs. This can be configured to your needs (see the "Filters section" below).

If you don't have any servers connected, you'll see a panel telling you to add a server:

![](./assets/xo5noserver.png)

### Add a host

Just click on "Add server", enter the IP of a XenServer host (ideally the pool master if in a pool):

![](./assets/xo5addserver.png)

After clicking on connect, the server is displayed as connected:

![](./assets/xo5connectedserver.png)

Now go back to the Home view (or click on the "Xen Orchestra" title on the top left of the screen), you'll see the default home view of VM objects.

### VMs

By default, this view groups all **running VMs** on your connected server:

![](./assets/xo5homevms.png)

Let's take a quick tour:

- the global menu is on the left, you can collapse it by clicking on the icon ![](./assets/xo5collapsemenu.png)
- the home view has a header with a type selector (VMs, hosts or pools), a filter zone and a button to create new VMs
- the VM list also has a header (number of filtered VMs and total VMs) and assisted filters (by pool, host and tags) and a sort menu (by name, memory etc.). You can also expand all VMs details here with the icon ![](./assets/xo5expandhome.png)

:::tip
You can edit a VM name, description and even current host by long clicking on the field
:::

### Bulk actions

You can select multiple objects (eg VMs) at once to perform a bulk action. The master checkbox will select all, or you can select anything yourself.

After selecting one or more object, an action bar is displayed:

![](./assets/xo5bulk.png)

This will execute the action for all selected objects!

### Hosts

All host objects are displayed:

![](./assets/xo5host.png)

You have power status, name, description, number of CPU cores, total memory, management IP and pool name displayed. You can also edit these by long clicking.

:::tip
If hosts have missing patches, you'll see a red dot with the total patches missing. Click on it to go the patch section of the host. See this blog post on [patches for XenServer](https://xen-orchestra.com/blog/hotfix-xs70e004-for-xenserver-7-0/) for more details.
:::

### Pools

All your pools are displayed here:

![](./assets/xo5pool.png)

You can also see missing patches in red.

:::tip
Did you know? Even a single XenServer host is inside a pool!
:::

## Live filter search

The idea is not just to provide a good search engine, but also a complete solution for managing all your XenServer infrastructure. Ideally:

- less clicks to see or do what you need
- find a subset of interesting objects
- perform bulk actions on all results found
- sort your results for more pertinent insight

:::tip
Pro Tip: the URL of Xen Orchestra contains the search string, eg `home?s=power_state%3Arunning+`. You can share these URLs to your colleagues to share your search!
:::

### Search examples

We include some predefined filters in the dropdown "Filters":

![](./assets/xo5presetfilter.png)

You can use custom filters here:

![](./assets/xo5presetfilter2.png)

### Save your search

If you want to record your filter, just click on the "Save" icon ![](./assets/xo5savefilter.png)

After giving a name to your filter, you will be able to find it in the dropdown filter menu.

### Manage your saved search

Just go into your user panel (bottom of main left menu):

![](./assets/xo5usericon.png)

There, you can edit or remove any filter/search you've created!

### Set a default search

In this user section, you can set a default filter (preset filters or your own).

:::tip
Pro Tip: this is saved in your user preferences. It means that you can connect anywhere on any browser, and you'll still see the same behavior.
:::

### Filter syntax

:::tip
A filter allows you to search through a collection of objects which have multiple properties and may even contain other nested objects.
:::

#### Searching for a string (or substring)

Simply type the string, if it contains special characters just surround it with quotes:

- `simple-string`
- `"string with special characters like whitespaces"`

:::tip
The search is recursive, case insensitive and non-anchored (i.e. matches if the pattern is contained in a string).
:::

A simple string can also contain a wildcard character (`*`) to match any character in a portion of the string:

- `foo*bar`: matches `foobar`, `foo - bar`, etc.

#### Regular expression

For more advanced string matching, you can use regular expressions:

- `/^DNS server \d+$/`: matches `DNS server 1`, `DNS server 05` but not `DNS server`
- `/foo/i`: with the `i` flag, it ignores the case, therefore it matches `Foo` and `FOO`

[More information about supported regular expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions).

#### Searching a specific property

Type the property name, followed by a colon `:` and a subfilter:

- `name_label:"my VM"`
- `virtualizationMode:hvm`
- `boot:order:cn`

#### Exclusion

Prefix your filter with an exclamation mark `!` to exclude any matching results:

- `!hvm`
- `!power_state:Running` or `power_state:!Running`

#### Intersection

Simply type the filter's terms side by side:

- `power_state:Halted !virtualizationMode:hvm`

#### Grouping

Parentheses can be used to group terms together:

- `!(power_state:Running virtualizationMode:hvm)`

#### Union

Pipe `|` followed by a group of terms:

- `|(vm1 vm2)`
- `power_state:|(Running suspended)`

#### Truthy property

This one is less common but can be used to check whether a property has a truth-like value (`true`, non-empty string or non-zero number).

Postfix the name of a property by a question mark `?`:

- `auto_poweron?`
- `high_availability?`

#### Number comparison

You can use the search field/filter with number comparisons:

- `snapshots:length:>2` (to display VMs with more than 2 snapshots)
- `$VBDs:length:>=4` (VMs with more 4 or more disks attached)
- `VIFs:length:>=2` (number of network interfaces)

### Available properties

There isn't much documentation listing these (yet), but you can see all objects and their properties using `xo-cli --list-objects`. You can then use these properties for search in XOA.

Take a look at [the documentation](https://github.com/vatesfr/xen-orchestra/tree/master/packages/xo-cli#xo-cli) for xo-cli :)

Example: to search by the Xen Tools status:

- `xenTools?`: whether the tools are installed
- `xenTools:"up to date"`: whether they are installed and up to date

## VM creation

A new VM can be created via the "New" button in the main menu (bottom):

![](./assets/xo5vmcreatemenu.png)

Or in the home view:

![](./assets/xo5newvmbutton.png)

### Wizard

#### Select your Pool

Because Xen Orchestra can be connected to multiple pools, you must select which one you want to create your VMs on:

![](./assets/xo5createonpool.png)

On which **host** the VM will actually run on will depend of various settings (local SR or not, RAM available etc.)

#### Infos category

##### Select your template

The next step is to select a template:

![](./assets/xo5createwithtemplate.png)

:::tip
What is a XenServer template? It can be 2 things: first an "empty" template, meaning it contains only the configuration for your future VM, such as example settings (minimum disk size, RAM and CPU, BIOS settings if HVM etc.) Or it could be a previous VM you converted into a template: in this case, creating a VM will clone the existing disks.
:::

##### Name and description

These values can be changed anytime after your VM is created.

##### Multiple VMs

You can create multiple VMs at once by toggling the _Multiple VMs_ option. The `{name}` pattern is the "Name" field of the VM. By default, it will start with number 1 and increment up. You can change this via the "First index" field.

Click on the refresh icon to see the change:

![](./assets/xo5multiplevms.png)

#### Performance

This is where you can configure VM performance options: number of vCPUs, RAM, CPU weight and cap.

##### CPU weight and cap

The default CPU weight is `256` which means it will be scheduled by Xen like any other VMs on the host it runs from. If you raise it, eg with `512`, CPUs on this VM will be scheduled with twice the priority as others. If you decrease it, with `64` for example, it will be scheduled with 4 times less priority.

What about cap? It's the maximum amount of CPUs a VM can consume, using a 100 base (1 vCPU: 100). Default is 0 and means no upper cap.

:::tip
Should I mess with these settings? In general: nope. Change this only if you are sure of what are you doing. More can be found here: https://wiki.xen.org/wiki/Credit_Scheduler
:::

#### Install settings

Depending of your template type (with existing disks or not, PV vs HVM) this panel can be changed.

##### HVM templates without existing disks

You can choose to boot from an ISO or using PXE:

![](./assets/xo5installsettings.png)

##### PV templates

These templates will use PV configuration in order to boot: either from the right ISO or network URL. PV Args can be used to modify kernel parameters, but it's a very advanced setting you shouldn't play with.

##### Template with existing disks

Because there is already disks installed, you shouldn't have "Install settings" _per se_. But you can use our `config drive` setup if your template already has CloudInit installed!

Please refer to the [XCP-ng CloudInit section](advanced.md#cloud-init) for more.

#### Interfaces

This is the network section of the VM configuration: in general, MAC field is kept empty (autogenerated from XenServer). We also select the management network by default, but you can change it to reflect your own network configuration.

#### Disks

This section is for configuring new or existing disks (according to your selected template).

:::tip
Protip: avoid using large disks for your VMs. Want to store a lot of files? Use a network share for that (NFS, SMB) and keep using VMs with small system disks. It's far easier to maintain, migrate, backup and restore!
:::

## VM management

### Live Editing

Any object with a dotted underline can be edited with a mouse click: VM title, description, CPU and memory.

![](./assets/xo5editvm.png)

In the advanced tab, you have extra options:

![](./assets/xo5vmadvanced.png)

### XCP-ng/Citrix Hypervisor limitations

- Each VM has a maximum vCPU number. This value can't be changed while the VM is running. You can reduce the number of vCPUs, but you can't assign more than the set max. In XO, while your VM is halted, set the max vCPUs you would need, then boot it. Now you can reduce it and then expand it later to this maximum.
- The same limitation applies to static RAM.

You can learn more about XenServer [resource management on the Citrix Website](https://docs.citrix.com/en-us/citrix-hypervisor/system-requirements/configuration-limits.html).
:::tip
XCP-ng doesn't limit VMs to 32 vCPU
:::
### VDI live migration

Thanks to Xen Storage Motion, it's easy to move a VM disk from one storage location to another, while the VM is running! This feature can help you migrate from your local storage to a SAN, or just upgrade your SAN without any downtime.

To do so: Access the Xen Orchestra page for your running VM, then enter the Disk tab. Long click on the current SR of the disk, and a drop down menu will be displayed with all compatible destinations. Just select one, that's all: the migration will start live!

![](./assets/xo5diskmigrate.png)

#### Offline VDI migration

Even though it's not currently supported in XenServer, we can do it in Xen Orchestra. It's exactly the same process as a running VM.

### VM recovery

In the advanced tab, use the "Recovery Start" button:

![](./assets/xo5recovery.png)

This button will allow you to boot directly from the CD drive, ignoring your current disks. Note that it works for all virtualization modes: HVM or PV.

### Auto power VM

Activating "Auto Power on" for a VM will also configure the pool accordingly. If your host is rebooted, the VM will be started right after the host is up.

### VM high availability (HA)

If you pool supports HA (must have shared storage), you can activate "HA". Read our blog post for more details on [VM high availability with XenServer](https://xen-orchestra.com/blog/xenserver-and-vm-high-availability/).

#### Docker management

:::tip
Please [read the dedicated section](manage_infrastructure.md#docker-support) to install a Docker Ready VM.
:::

### VM CPU priority

You can change the CPU Weight in the VM advanced view. The values are:

- Default
- Quarter (64)
- Half (128)
- Normal (256)
- Double (512)

By default, each VM has a weight of 256.

If one VM has for example, "Double", it will have double the priority on the Xen scheduler. [Read more on the official Citrix XenServer documentation](http://support.citrix.com/article/CTX117960).

### VM Copy

VM copy allows you to make an export and an import via streaming. You can target any SR in your whole XenServer infrastructure (even across different pools!)

### Snapshot management

You can create a snapshot with one click. It will be named automatically. After the snapshot is created, you can either:

- export it on your computer
- revert your VM to this snapshot (it will restart the VM)
- delete this snapshot

:::tip
By default, XOA will try to make a snapshot with quiesce. If the VM does not support it, it will fallback to the default snapshot system.
:::

## VM import and export

Xen Orchestra can import and export VM's in XVA format (XenServer format) or import OVA files (OVF1 format).

:::tip
We support OVA import from VirtualBox. Feel free to report issues with OVA from other virtualization platforms.
:::

### VM import

#### XVA files

To import an XVA file, just go to the New/Import menu:

![](./assets/xoa5import.png)

Select the target pool and SR where the VM will be imported. Then, drag and drop your file and click on the import button.

#### OVA files

OVA files contains extra info that you need to check before importing, like name, etc.

![](https://xen-orchestra.com/blog/content/images/2016/08/xo5import2.png)

When you are OK with these settings, just click on the "Import" button.

### VM export

:::tip
Exported VMs are in XVA format
:::

Just access the page for the VM that you want to export, and click on the "Export" button in the toolbar. You'll instantly download a compressed XVA file.

It works even if the VM is running, because we'll automatically export a snapshot of this VM.

#### Snapshot export

In the VM "Snapshots" tab, you can also export a snapshot like you export a VM.

## Hosts management

Outside updates (see next section), you can also do host management via Xen Orchestra. Basic operations are supported, like reboot, shutdown and so on.

But there's also some specific things, like Maintenance mode.

### Maintenance mode

:::warning
If you are using HA, maintenance mode will be required before doing any reboot or update. NEVER forget to enable maintenance in HA!
:::

Maintenance mode will trigger two actions internally:

- disabling the host (no new VMs could start on it)
- evacuate VMs that can be evacuated ("agile" VMs, which could be live migrated)

It's perfect if you want to shutdown the host for hardware replacement, or if you want to do some other operations without disrupting your production.

![](./assets/maintenancemode.png)

Note that maintenance mode will be **automatically exited after a host reboot**.

## Hosts updates

Patching a host manually can be time consuming (and boring). That's why we provide the high level feature of downloading and applying all missing patches automatically.

:::tip
Update mechanism is different between Citrix Hypervisor and XCP-ng. However, Xen Orchestra provides a similar UI for both systems, handled entirely transparently for you!
:::

### XOA smart update system

Your XOA will check the official Citrix servers for missing patches. They will be displayed if any:

- in dashboard view
- in pool view (plus the number of missing patches in a red box)
- in host view (in patching tab, same red pill)

### Installing patches

When you click on "Install all patches", XOA will do all of the following automatically:

- fetch all missing patches from Citrix servers
- unzip them
- upload them
- apply them in the correct order

You can see more screenshots here: https://xen-orchestra.com/blog/hotfix-xs70e004-for-xenserver-7-0/

:::tip
If you are behind a proxy, please update your `xo-server` configuration to add a proxy server, as [explained in the appropriate section](configuration.md#proxy-for-xenserver-updates-and-patches).
:::

### Notes on patching

- Xen Orchestra won't reboot your hosts automatically. That's your call to choose when to do it.
- Patching doesn't always require rebooting. Check in the host view if the reboot warning is displayed, it means you need to reboot to have the patch fully applied (see screenshot below)
- XO will install all patches without rebooting: that's not an issue. Even applying patches manually, **it's not mandatory to reboot after each patch**.

![](./assets/xo5patching.png)

## Pool Management

::: danger
As specified in the [documentation](https://xcp-ng.org/docs/requirements.html#pool-requirements) your pool shouldn't consist of hosts from different CPU vendors.
:::
::: warning
- Even with matching CPU vendors, in the case of different CPU models XCP-ng will scale the pool CPU ability to the CPU having the least instructions.
- All the hosts in a pool must run the same XCP-ng version.
:::
### Creating a pool

First you should add your new host to XOA by going to New > Server as described in [the relevant chapter](manage_infrastructure.md#add-a-host).

When you add your host to XOA a pool will automatically be created for it, taking the host name as the default pool name. The pool name can be edited to match your needs.

To edit the name of your pool go to Home > Pools and long click on the pool name to edit it.

### Adding a host to an existing pool

If you need to add a new host to a pool, first you need to add your new host to your XOA by going to New > Server as described in [the relevant chapter](manage_infrastructure.md#add-a-host).

Then you need to add the new host to the desired pool. Navigate to Home > Pools, and click on the desired pool. Then in the top right, click the Add Hosts button and select your new host.

### Adding an existing pool

If your hosts are already in a pool you only need to add your pool master host to XOA, the slaves will be added automatically.
::: danger
Don't add pool slaves to your XOA server list! XOA will automatically find them from the master you add.
:::

## Visualizations

Visualizations can help you to understand your XenServer infrastructure, as well as correlate events and detect bottlenecks.

:::tip
:construction_worker: This section needs to be completed: screenshots and how-to :construction_worker:
:::

### Dashboard

The dashboard view gathers information on all your connected pools/hosts.

![](./assets/visualizationdashboard.png)

:::tip
You can also update all your hosts (install missing patches) from this page.
:::

### Parallel Coordinates

A Parallel Coordinates visualization helps to detect proportions in a hierarchical environment. In a XenServer environment, it's especially useful if you want to see useful information from a large amount of data.

![](./assets/parralelcoordinates.png)

## Health

This view will help you find any bottlenecks and compare the metrics of your infrastructure.

:::tip
:construction_worker: This section needs to be completed: screenshots and how-to :construction_worker:
:::

### Heatmap

A heatmap allows its reader to understand when your VMs or hosts are stressed. Values are relative, thus it's easy to detect trends or spikes.

[![](./assets/heatmap.png)](https://xen-orchestra.com/blog/xen-orchestra-4-4/#heatmapforinfrastructurehealth).

### Event correlation

This is the place to compare metrics on comparable objects (VMs to VMs, hosts to hosts).

[![](https://xen-orchestra.com/blog/content/images/2015/09/correlate_small.jpg)](https://xen-orchestra.com/blog/xen-orchestra-4-6#eventcorrelation).

## Docker support

This allows you to enjoy Docker containers displayed directly in Xen Orchestra.

### Prerequisites

- XenServer 6.5 or higher
- Plugin installation (for Citrix Hypervisor, it's included in XCP-ng)

### Docker plugin installation

This first step is needed until Docker is supported natively in the XenServer API (XAPI).

:::tip
The plugin should be installed on every host you will be using, even if they are on the same pool.
:::

#### For XenServer 6.5

1. SSH to your XenServer
1. Download the plugin: `wget http://downloadns.citrix.com.edgesuite.net/10343/XenServer-6.5.0-SP1-xscontainer.iso`
1. Install it: `xe-install-supplemental-pack XenServer-6.5.0-SP1-xscontainer.iso`

#### For XenServer 7.0

1. SSH to your XenServer
1. Download the plugin: `wget http://downloadns.citrix.com.edgesuite.net/11621/XenServer-7.0.0-xscontainer.iso`
1. Install it: `xe-install-supplemental-pack XenServer-7.0.0-xscontainer.iso`

#### For XenServer 7.1

1. SSH to your XenServer
1. Download the plugin: `wget http://downloadns.citrix.com.edgesuite.net/11993/XenServer-7.1.0-xscontainer.iso`
1. Install it: `xe-install-supplemental-pack XenServer-7.1.0-xscontainer.iso`

#### For XenServer 7.2

1. SSH to your XenServer
1. Download the plugin: `wget http://downloadns.citrix.com.edgesuite.net/12641/XenServer-7.2.0-xscontainer.iso`
1. Install it: `xe-install-supplemental-pack XenServer-7.2.0-xscontainer.iso`

That's it! You can now enjoy Docker support!

### Docker managed VMs

You can also use the XSContainer plugin to "transform" an existing VM into a "Docker" managed VM.

You need to have the following installed inside the VM:

- Docker
- openssh-server
- ncat

For Debian/Ubuntu like distro: `apt-get install docker.io openssh-server nmap`. For RHEL and derived (CentOS...): `yum install docker openssh-server nmap-ncat`.

To run Docker as non-root, please add the user you want inside the "Docker" group.

Now you need to access your host (Dom0) and use the following command:

```
xscontainer-prepare-vm -v <VM_UUID> -u <username>
```

:::tip
Because "prepare-vm" is not exposed outside of the Dom0 (yet?), we can't use Xen Orchestra to give you a one-click solution as of now.
:::
