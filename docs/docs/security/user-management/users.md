---
sidebar_position: 2
---

# Users

<InterfaceNote>This page describes user management in the XO 5 interface. XO 6 currently lists users (with their groups and tokens); creating and editing them still happens here.</InterfaceNote>

Xen Orchestra involves three distinct notions of "user account". Make sure you are looking at the right one:

- **XOA system accounts**: the Linux accounts (`xoa`, `root`) of the appliance itself, used for SSH and console access. See [First login](../../getting-started/installation/xoa.md#first-login).
- **XO application users**: the accounts inside the Xen Orchestra web application. This is what this page is about.
- **XO 6 / REST API roles**: XO 6 introduces a new RBAC model with roles and fine-grained privileges. See the [RBAC page](./rbac.md).

There are 2 types of XO users:

- **admins**, with all rights on all connected resources
- **users**, with no rights by default

:::note
Local user accounts should be avoided in production environments. LDAP authentication is strongly recommended for centralized credential management.
:::

## Authentication

Users can log in with a built-in account, or through an external authentication provider: LDAP, OpenID Connect, SAML, GitHub or Google. See [Authentication providers](authentication-providers.md) to set them up, including two-factor authentication for built-in accounts.

## ACLs (XO 5 only) {#acls}

### Definition

ACLs are permissions that apply to preexisting objects, like users and groups.

:::note
This section describes the original ACLs, used by the XO 5 interface. The REST API and XO 6 use a broader model: see [RBAC](./rbac.md).
:::

### Who can manage ACLs?

Only a super admin (XO administrator) can manage ACLs.

### How can I view and edit ACLs?

The ACLs view can be accessed in the **Settings** panel.

1. Select the user or group you want to apply permissions on
2. Select the object on which the permission will apply
3. Choose the role for this ACL
4. Click the **Create** button.

<UiDetail src="/img/xo5/acl-creation.png" alt="The ACL creation form: subject, object and role selectors followed by the Create button" width={700} />

:::tip
You can click to add multiple objects at the same time!
:::

Your ACL is now available in the right list:

<UiDetail src="/img/xo5/acl-list.png" alt="The list of existing ACLs, each row showing the user, the object and the assigned role" width={620} />

You can edit or remove existing ACLs here.

### Roles

There are 3 different roles for your users:

- Admin
- Operator
- Viewer

#### Admin

An object admin can do everything on it, even destroy it. E.g with its admin VM:

- remove it
- migrate it (to a host with admin permission on it)
- modify the VM resources, name and description
- clone it
- copy it
- convert it into a template
- snapshot it (even revert from a snapshot)
- export it
- attach/add visible disks
- same for network cards

#### Operator

An operator can make everyday operations on assigned objects. For example, on a VM:

- eject a CD
- insert a CD (if he can view the ISO storage repository)
- start, restart, shutdown, suspend/resume it

All other operations are forbidden.

#### Viewer

A viewer can only see the VM state and its metrics. That's all!

### Inheritance

Objects have a hierarchy: a Pool contains all its hosts, containing itself all its VMs.

If you give a _view_ permission to a user (or a group) on a pool, he will automatically see all the objects inside this pool (SRs, hosts, VMs).

### Examples

#### Allow a user to install an OS

If the OS install needs an ISO, you need to give this user 2 permissions:

- _Operate_ on the VM (e.g to start it)
- _View_ on the ISO Storage containing the needed ISO.

## Self-service portal

The self-service feature allows users to create new VMs. This is different from delegating existing resources (VMs) to them, and it leads to a lot of possibilities.

### Set of resources

To create a new set of resources to delegate, go to the "Self Service" section in the main menu:

<UiDetail src="/img/xo5/self-service-menu.png" alt="The Self Service entry in the XO main menu" width={180} />

#### Create a set

:::tip
Only an admin can create a set of resources
:::

To allow people to create VMs as they want, we need to give them a _part_ of your XCP-ng/XenServer resources (disk space, CPUs, RAM). You can call this "general quotas" if you like. But you first need to decide which resources will be used.

In this example below, we'll create a set called **"sandbox"** with:

- "devs" is the group that can use this set (all users in the group)
- "Lab Pool" is the pool where they can play
- "Debian 8 Cloud Ready" is the only template they can use
- "SSD NFS" is the only SR where they can create VMs
- "Pool-wide network with eth0" is the only available network for them

<UiDetail src="/img/xo5/self-service-set-creation.png" alt="The resource set creation form: name, subjects, pools, templates, SRs, networks and limits, with the eligible hosts below" width={700} />

As you can see, only compatible hosts are shown and can be used for this resource set (hosts in another pool aren't shown). This way, you can be sure to have resources free for tasks other than self-service.

:::tip
Don't forget to add an ISO SR to allow your users to install VMs with CD if necessary
:::

##### Quotas

Then, you can define quotas on this set:

- max vCPUs
- max RAM
- max disk usage

:::tip
Replicated VMs and snapshots created by a backup job don't use quotas.
:::

:::tip
A snapshot of a Self Service VM will use as much resources as a VM would. You can disable this by setting `ignoreVmSnapshotResources` to `true` in the `selfService` section of `xo-server`'s config.
:::

When you click on create, you can see the resource set and remove or edit it:

<UiDetail src="/img/xo5/self-service-set-quotas.png" alt="The saved resource set recap, with its quota gauges for CPUs, RAM and disk usage" width={700} />

### Usage (user side)

As soon as a user is granted a resource set, it displays a new button in their main view: "new".

<UiDetail src="/img/xo5/self-service-new-vm-button.png" alt="The New button displayed in the user's main menu" width={160} />

Now, the user can create a VM with only the resources granted in the set:

<UiShot light="/img/xo5/self-service-vm-creation.png" alt="The VM creation page restricted to the sandbox resource set: only the delegated template, SR and network are selectable" url="https://your-xo/v5/#/vms/new" />

And the recap before creation:

<UiDetail src="/img/xo5/self-service-quota-summary.png" alt="The summary gauges showing how much of the set's quota the new VM will consume" width={700} />

If the "Create" button is disabled, it means the user requested more resources than available.

Finally, if a user has been granted access to multiple resource sets, they can be switched in the top right of the screen.

### Toward the Cloud

Self-service is a major step in the Cloud. Combine it with our [Cloudinit compatible VM creation](../../manage-your-infrastructure/infrastructure/vm-templates.md#cloud-init) for a full experience:

- create a Cloud ready template
- create a set and put Cloud templates inside
- delegate this set to a group of users

Now, your authorized users can create VMs with their SSH keys, grow template disks if needed, etc. Everything is inside a "sandbox" (the resource set) you defined earlier!

## Audit log

XO Audit Log is a plugin that records all important actions performed by users and provides the administrators an overview of each action. This gives them an idea of the users behavior regarding their infrastructure in order to track suspicious activities.

### How does it work?

XO Audit Log listens to important actions performed by users and stores them in the XOA database using the [hash chain structure](https://en.wikipedia.org/wiki/Hash_chain).

### Trustability of the records

Stored records are secured by:

- structure: records are chained using the hash chain structure which means that each record is linked to its parent in a cryptographically secure way. This structure prevents the alteration of old records.

- hash upload: the hash chain structure has limits, it does not protect from the rewrite of recent/all records. To reduce this risk, the Audit log plugin regularly uploads the last record hash to our database after checking the integrity of the whole record chain. This functionality keeps the records safe by notifying users in case of alteration of the records.

### Configuration {#configuration-1}

The recording of the users' actions is disabled by default. To enable it:

1. go into `settings/plugins`
2. expand the `audit` configuration
3. toggle active and save the configuration

<UiDetail src="/img/xo5/audit-log-plugin-config.png" alt="The audit plugin configuration, with the active toggle enabled" width={620} />

Now, the audit plugin will record users' actions and upload the last record in the chain every day at **06:00 AM (UTC)**.

## Debugging

If you can't log in, please [check the logs of `xo-server`](../../support-and-reference/troubleshooting.md#logs).
