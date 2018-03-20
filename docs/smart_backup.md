# Smart backup

There are two ways to select which VMs will be backed up:

1. Multiple VM selector
1. Smart backup

Picking VMs manually can be a limitation if you environment is moving fast (i.e. having new VMs you need to backup often), Because you needed to edit the previous job and add it.

But thanks to *smart backup*, you now have more flexibility: you won't select specific VMs, but VMs status/tag/placement **at the time backup job will be executed**. Let's see some examples!

## Backup all VMs on a pool

This job will backup all VMs on a pool "Lab Pool" when scheduled:

![](https://xen-orchestra.com/blog/content/images/2016/08/xo5smartbackup1.png)

It means: **every VM existing on this pool at the backup schedule will be backup**. Doesn't matter if you create a new VM, it will be backup too without editing any backup job.

**You can now plan a smart backup on a production pool when only important VMs are**.

Want to narrow the job a bit? See below.

## Backup filters

You can also:

* backup only running (or halted) VMs when the job is executed
* backup only VMs with a tag

Remember the Prod VMs? I added a tag "prod" for each of them:

![](https://xen-orchestra.com/blog/content/images/2016/08/xo5smartbackuptag.png)

Now if you do this:

![](https://xen-orchestra.com/blog/content/images/2016/08/xo5smartbackup2.png)

It means any VMs on "Lab Pool" with the "prod" tag will be backed up.
