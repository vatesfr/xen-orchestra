# Continuous Replication

> This feature is out since 4.12

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

![](https://xen-orchestra.com/blog/content/images/2016/01/remplication_small.png)