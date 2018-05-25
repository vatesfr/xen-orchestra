# Self Service

The self-service feature allows users to create new VMs. This is different from delegating existing resources (VM's) to them, and it leads to a lot of possibilities.

## Set of resources

To create a new set of resources to delegate, go to the "Self Service" section in the main menu:

![](./assets/selfservice_menu.png)

### Create a set

> Only an admin can create a set of resources

To allow people to create VMs as they want, we need to give them a *part* of your XenServer resources (disk space, CPUs, RAM). You can call this "general quotas" if you like. But you first need to decide which resources will be used.

In this example below, we'll create a set called **"sandbox"** with:

* "devs" is the group that can use this set (all users in the group)
* "Lab Pool" is the pool where they can play
* "Debian 8 Cloud Ready" is the only template they can use
* "SSD NFS" is the only SR where they can create VMs
* "Pool-wide network with eth0" is the only available network for them

![](./assets/selfserviceset.png)

As you can see, only compatible hosts are shown and can be used for this resource set (hosts in another pool aren't shown). This way, you can be sure to have resources free for tasks other than self-service.

> Don't forget to add an ISO SR to allow your users to install VMs with CD if necessary

#### Quotas

Then, you can define quotas on this set:

* max vCPUs
* max RAM
* max disk usage

> Note: Snapshotting a VM within a self-service will use the quota from the resource set. The same rule applies for backups and replication.  

When you click on create, you can see the resource set and remove or edit it:

![](./assets/selfservice_recap_quotas.png)

## Usage (user side)

As soon as a user is granted a resource set, it displays a new button in their main view: "new". 

![](./assets/selfservice_new_vm.png)

Now, the user can create a VM with only the resources granted in the set:

![](./assets/selfservice_create_vm.png)

And the recap before creation:

![](./assets/selfservice_summary_quotas.png)

If the "Create" button is disabled, it means the user requested more resources than available.

Finally, if a user has been granted access to multiple resource sets, they can be switched in the top right of the screen.


## Toward the Cloud

Self-service is a major step in the Cloud. Combine it with our [Cloudinit compatible VM creation](cloudinit.md) for a full experience:

* create a Cloud ready template
* create a set and put Cloud templates inside
* delegate this set to a group of users

Now, your authorized users can create VMs with their SSH keys, grow template disks if needed, etc. Everything is inside a "sandbox" (the resource set) you defined earlier!

![](https://pbs.twimg.com/media/CYMt2cJUkAAWCPg.png)
