# Self Service

The self-service feature is the possibility for users to create new VMs. That's different from delegating existing resources to them, and it leads to a lot of side-effects.

> This feature is not yet available yet. Still, we already made efforts to design it, it should be done in the next months.

## Set of resources

To allow people creating VMs as they want, we need to give them a *part* of your XenServer resources (disk space, CPUs, RAM). You can call this "general quotas" if you like. But you need first to decide how those quota applies in your infrastructure:

* which Storage Repository?
* which Networks?
* which Templates can be used?

Then, you can limit resources:

* maximum vCPUs, RAM and disk usage
* maximum number of VMs and VDIs


After, you just have to assign a group or a user to this set. Any created VM in this set will be administrable for user/group of this set.

Details are given in [this GitHub issue](https://github.com/vatesfr/xo-web/issues/285). Feel free to contribute to help up!

## Toward the Cloud

* SSH keys and root partition growing with CloudInit is already possible (see XO [CloudInit](cloudinit.md) documentation)