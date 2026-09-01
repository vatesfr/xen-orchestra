# VM templates

<InterfaceNote />

Virtual machine templates in Xen Orchestra make it easy to deploy new VMs by providing a ready-to-use configuration with predefined hardware specs and settings. Instead of manually setting up each VM from scratch, you can use templates to speed up deployment and keep things consistent.

<UiShot light="/img/xo5/template-menu.png" alt="The Templates view, from Home" url="https://your-xo/v5/#/home?t=VM-template" />

## Creating Templates

There are a few ways to create a VM template in Xen Orchestra:

### From an Existing VM

Set up a VM with your preferred OS and settings, then convert it into a template.

:::warning
Once you convert a VM into a template, it won’t show up in the VM list anymore: this change is permanent.
:::

1. Select your VM and go to the **Advanced** tab.
2. Click **Convert to template**, then confirm.

<UiDetail src="/img/xo5/convert-to-template.png" alt="Convert to template, in the VM Advanced tab" width={700} />

### Clone an Existing Template

Duplicate one of the built-in templates and customize it to match your needs.

1. Go to **Home → Templates**.
2. Check the box next to the template(s) you want to copy.
3. Click the **Copy button** in the header.
4. Fill out the details in the dialog box.

<UiDetail src="/img/xo5/copy-template.png" alt="Select templates, then copy them from the header" width={700} />

### Create a VM and Convert It

Set up a new VM (without installing an OS), adjust its hardware settings, and turn it into a template. This is useful if you just want a predefined hardware setup without an OS baked in.

To learn more about VM creation, read the [VM creation](./manage_infrastructure#vm-creation) section.

## Viewing Template Properties

### From Xen Orchestra

To check a template’s settings in Xen Orchestra:

1. Head to the **Home → Templates** section.
2. Check the box next to the template(s) you want to inspect.
3. Click the hamburger button on the corresponding line to see details like CPU, RAM, and template tags.

<UiDetail src="/img/xo5/template-details-ui.png" alt="Template details, expanded from the Home › Templates list" width={700} />

### From the REST API

If you need more technical details than what the UI shows, the Xen Orchestra API has everything.

To learn more, read the [REST API documentation](../automation/restapi.md).

All collections are listed when you run `GET /rest/v0`, including the `vm-templates` collection:

<UiShot light="/img/xo5/template-list.png" alt="The vm-templates collection, straight from the REST API" url="https://your-xo/rest/v0/vm-templates" />

<UiDetail src="/img/xo5/rest-api-template-example.png" alt="A single VM template object, from the REST API" width={560} />

### From the CLI

You can also inspect a template with the `xe` CLI, from a host console.

For example, if your template is named `My Debian Template`:

<Terminal shell title="inspect a template with xe, from a host console">{`
xe template-list name-label="My Debian Template"
uuid=$(xe template-list name-label="My Debian Template" --minimal)
xe template-param-list uuid=$uuid | less
`}</Terminal>

## Deleting a Template

Need to delete a template? Here’s how:

:::warning
Before deleting a template, make sure to find and remove any attached disks. Otherwise, you'll end up with orphaned VDIs.
:::

1. In Xen Orchestra, go to the **Home → Templates** section.
2. Check the box next to the template(s) you want to delete.
3. Click the trash can icon in the header and confirm the deletion.

## Viridian extensions

VMs include a parameter to enable Viridian extensions.

### What is Viridian?

Viridian is a codename for [Hyper-V](https://learn.microsoft.com/en-us/windows-server/virtualization/hyper-v/hyper-v-overview), a native hypervisor developed by Microsoft that allows the creation of virtual machines on x86-64 systems running Windows.

Viridian extensions (referred to as "Viridian enlightenments" by Microsoft) are used by any "recent" Windows OS to work properly. Consequently, the Viridian setting in Xen Orchestra is typically enabled by default for all Windows templates from Windows 2012 onwards.

### Step-by-step guide

:::warning
We strongly advise creating Windows templates by starting from a built-in Windows template, as the Viridian setting in Xen Orchestra is only relevant for those.
:::

#### Templates based on built-in Windows templates

To find and enable the Viridian setting for your template:

1. Navigate to the **Home → VMs** menu.\
   A list of VMs appears.
2. Choose your VM from the list and click its name.\
   The VM details screen appears.
3. Click the **Advanced** tab to show more settings for your VM.
4. In the **Xen settings** section, scroll to the end and activate the **Viridian** toggle switch:
   <UiDetail src="/img/xo5/viridian-extensions.png" alt="The Viridian toggle, in the Xen settings of the VM Advanced tab" width={620} />
   Viridian extensions are now enabled for your VM. You can now safely use this VM to create your Windows template.

#### Enabling Viridian for other non-Windows VM templates

To enable Viridian enlightenments for other non-Windows VM templates, follow the instructions detailed in the **Virtual Machines (VMs)** section of the [XCP-ng technical documentation](https://docs.xcp-ng.org/vms/).

## Cloud-init and Cloudbase-init

If you want VMs to set themselves up automatically after deployment, **Cloud-init** (for Linux) and **Cloudbase-init** (for Windows) can help.

### Cloud-init

Cloud-init is a program that handles the early initialization of a cloud instance of Linux.
In other words, on a "Cloud-init-ready" VM template, you can pass a lot of data at first boot, such as:

- Set the host name
- Add SSH keys
- Automatically grow the file system
- Create users
- And a lot more!

This tool is pretty standard and used everywhere. A lot of existing cloud templates use it.

This means that you can easily customize your VM when you create it from a compatible template. It brings you closer to the "instance" principle like in Amazon Cloud or OpenStack.

### Cloudbase-init (Windows)

As of release 5.101, Xen Orchestra also supports Cloudbase-init. This tool provides equivalent functionality to Cloud-init but is specifically designed for Windows virtual machines.

To build such a template, follow the dedicated [Windows templates with Cloudbase-init](../windows-templates.md) guide.

### Requirements

The only requirement is a template whose VM has Cloud-init (for Linux) or Cloudbase-init (for Windows) installed inside it.
[Check this blog post to learn how to install Cloud-init](https://xen-orchestra.com/blog/centos-cloud-template-for-xenserver/).

:::tip
In XOA 5.31, we changed the Cloud-init config drive type from [OpenStack](https://cloudinit.readthedocs.io/en/latest/topics/datasources/configdrive.html) to the [NoCloud](https://cloudinit.readthedocs.io/en/latest/topics/datasources/nocloud.html) type. This will allow us to pass network configuration to VMs in the future. For 99% of users, including default cloud-init installs, this change will have no effect. However if you have previously modified your cloud-init installation in a VM template to only look for `openstack` drive types (for instance with the `datasource_list` setting in `/etc/cloud/cloud.cfg`) you need to modify it to also look for `nocloud`.
:::

### Example: How to create a Cloudbase-init template with Windows Server?

Refer to the [Windows templates with Cloudbase-init](../windows-templates.md) guide for complete instructions.

### Example: How to create a Cloud-init template with Ubuntu 22.04 LTS?

Create a VM with e.g. 2 vCPUs, 8 GiB of RAM and 10 GiB of disk space, and install Ubuntu 22.04 LTS on it. Once it reboots, bring it up to date and install the [Guest Tools](https://docs.xcp-ng.org/vms/#%EF%B8%8F-guest-tools):

<Terminal shell title="update the future template">{`
sudo apt update
sudo apt upgrade
`}</Terminal>

Install `cloud-initramfs-growroot` so the VM can grow its file system when a Cloud Config asks for it:

<Terminal shell title="allow the root file system to grow">{`
sudo apt install cloud-initramfs-growroot
`}</Terminal>

Finally, reset the Cloud-init state and clear the machine-id, so both are regenerated on every VM created from the template:

<Terminal shell title="reset Cloud-init and the machine-id">{`
sudo cloud-init clean
sudo truncate -s 0 /etc/machine-id /var/lib/dbus/machine-id
`}</Terminal>

Shut down the VM and [convert it into a template](#from-an-existing-vm).

### Usage

First, select your compatible template (Cloud-init ready) and name it:

<UiDetail src="/img/xo5/cloud-init-1.png" alt="Pick a Cloud-init-ready template and name your VM" width={620} />

Then, activate the config drive and insert your SSH key. Or you can also use a custom Cloud-init configuration:

<UiDetail src="/img/xo5/cloud-init-2.png" alt="Activate the config drive, then provide your SSH key or a custom config" width={620} />

:::tip
Cloud-init configuration examples are [available in the official documentation](https://cloudinit.readthedocs.io/en/latest/reference/examples.html).
:::

You can extend the disk size (**in this case, the template disk was 8 GiB originally**). We'll extend it to 20 GiB:

<UiDetail src="/img/xo5/cloud-init-3.png" alt="Extend the template disk at creation time" width={620} />

Finally, create the VM:

<UiDetail src="/img/xo5/cloud-init-4.png" alt="Create the VM" width={620} />

Now start the VM and SSH to its IP:

- **the system has the right hostname** (taken from the VM name)
- you don't need a password to access it (thanks to your SSH key):

<Terminal title="SSH into the new VM, no password needed">{`
ssh ubuntu@192.168.100.226
ubuntu@tmp-app1:~$
`}</Terminal>

The default Cloud-init configuration allows you to become a sudoer directly:

<Terminal title="sudoer out of the box">{`
sudo -s
root@tmp-app1:/home/ubuntu#
`}</Terminal>

Check the root file system size: **it was automatically grown** to the size you asked for:

<Terminal title="the root file system was grown automatically">{`
df -h /
/dev/xvda1          20G    1.2G   18G   6% /
`}</Terminal>
