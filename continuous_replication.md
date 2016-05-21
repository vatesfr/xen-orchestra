# Continuous Replication

> This feature is released since 4.12

> WARNING: it works only on XenServer 6.5 or later

> WARNING 2: this feature is very new, use it with caution until 4.13

This feature allow continuous replication system for your XenServer VMs without any storage vendor lock-in. You can now replicate a VM every xx minutes/hours on a any storage repository. It could be on a distant XenServer host or just another local storage.

This feature covers multiple objectives:

* no storage vendor lock-in
* no configuration (agent-less)
* low Recovery Point Objective, from 10 minutes to 24 hours (or more)
* flexibility
* no intermediate storage needed
* atomic replication
* efficient DR (disaster recovery) process

If you lose your main pool, you can start the copy on the other side, with very recent data.

![](https://xen-orchestra.com/blog/content/images/2016/01/replication.png)

> Warning: that's normal you can't boot the copied VM directly: we protected it. The normal workflow is to make a clone and to work on it.

## Configure it

As you'll see, this is trivial to configure. Inside the "Backup" section, select "Continuous Replication":

![](https://xen-orchestra.com/blog/content/images/2016/01/continuous_replication.png)

Then:

1. Select VMs you want to protect
1. Schedule the replication interval
1. Select the destination storage (could be any storage connected to any XenServer host!)

![](https://xen-orchestra.com/blog/content/images/2016/01/continuous_replication2.png)

> In this case, we'll replicate 2 VMs to "NFS" SR which is a pool called "Other Pool". Replication will happen every 20 minutes.

That's it! Your VMs are protected and replicated as requested.

To protect the replication, we removed the possibility to boot your copied VM directly, because if you do that, it will break the next delta. The solution is to clone it if you need it (a clone is really quick). You can do whatever you want with this clone!

## Initial seed

If you can't transfer the first backup through your network, you can make a seed locally. In order to do this, follow this procedure (until we made it accessible directly in XO):


### Preparation

1. create a cont. rep job to a non-distant SR (even the SR where is currently the VM). Do NOT enable the job at the creation.
1. start manually the first replication (only the first)
1. when finished, export the replicated VM (via XOA or any other mean, doesn't matter until you got your XVA file)
1. import the replicated VM on destination
1. you can remove your local replicated copy

### Modifications

In your source host:

1. Get the UUID of the remote destination SR where your VM was imported
1. On the source host: `xe vm-param-list uuid=<SourceVM_UUID> | grep other-config`.
  * You should see somewhere in other-config: `xo:base_delta:<SR_UUID>: <VM_snapshot_UUID>;`
  * Remove this entry with `xe vm-param-remove uuid=<OriginalVM_UUID> param-name=other-config param-key=xo:base_delta:<SR_UUID>`
  * Recreate the correct param: `xe vm-param-set uuid=<OriginalVM_UUID> other-config:xo:base_delta:<destination_SR_UUID>=<VM_snapshot_UUID>`

In XO:

1. Edit the replication job and select the new destination SR

### Enable

Run manually a first time to check if everything is OK. Then, enable the job. **Now, only the delta's are sent, your initial seed saved you a LOT of time.**