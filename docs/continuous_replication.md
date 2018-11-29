
# Continuous Replication

> WARNING: it works only with XenServer 6.5 or later

This feature is a continuous replication system for your XenServer VMs **without any storage vendor lock-in**. You can replicate a VM every *X* minutes/hours to any storage repository. It could be to a distant XenServer host or just another local storage target.

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

> Warning: it is normal that you can't boot the copied VM directly: we protect it. The normal workflow is to make a clone and then work on it.

## Configure it

As you'll see, it is trivial to configure. Inside the "Backup/new" section, select "Continuous Replication".

Then:

1. Select the VMs you want to protect
1. Schedule the replication interval
1. Select the destination storage (could be any storage connected to any XenServer host!)

That's it! Your VMs are protected and replicated as requested.

To protect the replication, we removed the possibility to boot your copied VM directly, because if you do that, it will break the next delta. The solution is to clone it if you need it (a clone is really quick). You can then do whatever you want with this clone!

## Manual initial seed

> This is **only** if you need to make the initial copy without making the whole transfer through your network. Otherwise, **you don't need this**. These instructions are for Backup-NG jobs, and will not work to seed a legacy backup job. Please migrate any legacy jobs to Backup-NG

**If you can't transfer the first backup through your network because it's too large**, you can make a seed locally. In order to do this, follow this procedure (until we make it accessible directly in XO):

### Preparation

1. ?? create a cont. rep job to a non-distant SR (even the SR where the VM currently is). Do NOT enable the job during creation.
1. ?? manually start the first replication (only the first)
1. ?? when finished, export the replicated VM (via XOA or any other means, doesn't matter how you get your XVA file)
1. ?? Import the replicated VM on your distant destination
1. ?? `cr-seed-cli`
1. ?? you can now remove your local replicated copy

```
> npm i -g @xen-orchestra/cr-seed-cli 
> xo-cr-seed 
> Usage: xo-cr-seed <source XAPI URL> <source snapshot UUID> <target XAPI URL> <target VM UUID> <backup job id> <backup schedule id> 
> xo-cr-seed v0.2.0
```


### Enable

Manually run the job the first time to check if everything is OK. Then, enable the job. **Now, only the deltas are sent, your initial seed saved you a LOT of time if you have a slow network.**
