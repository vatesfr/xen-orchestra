# Backup Concurrency


Xen Orchestra 5.20 introduces new tools to manage backup concurrency. Below is an overview of the backup process and ways you can control concurrency in your own environment.

## Backup process

### 1. Snapshot creation

When you perform a backup in XCP-ng/XenServer, the first operation performed is to "freeze" the data at a specific time - this is done by **making a snapshot**. This operation is pretty quick, only a few seconds in general. However it uses a lot of I/O on your storage, therefore more I/O activity means longer times to snapshot. Still, the order of magnitude is seconds per VM.

### 2. Export

Xen Orchestra will fetch the content of the snapshot made in step 1. This operation can be very long, obviously depending on the size of the snapshot to export: exporting 1TiB of data will take far longer than exporting 1GiB!

### 3. Snapshot removal

When it's done exporting, we'll remove the snapshot. Note: this operation will trigger a coalesce on your storage in the near future.

## Concurrency

Let's say you want to backup 50 VMs (each with 1x disk) at 3:00 AM. There are **2 different strategies**:

1. backup VM #1 (snapshot, export, delete snapshots) **then** backup VM #2 -> *fully sequential strategy*
2. snapshot all VMs, **then** export all snapshots, **then** delete all snapshots for finished exports -> *fully parallel strategy*

The first purely sequential strategy will lead to a big problem: **you can't predict when a snapshot of your data will occur**. Because you can't predict the first VM export time (let's say 3 hours), then your second VM will have its snapshot taken 3 hours later, at 6 AM. We assume that's not what you meant when you specified "backup everything at 3 AM". You would end up with data from 6 AM (and later) for other VMs.

Strategy number 2 is better in this aspect: all the snapshots will be taken at 3 AM. However **it's risky without limits**: it means potentially doing 50 snapshots or more at once on the same storage. **Since XenServer doesn't have a queue**, it will try to do all of them at once. This is also prone to race conditions and could cause crashes on your storage.

So what's the best choice? Continue below to learn how to best configure concurrency for your needs.

### Best choice

By default the *parallel strategy* is, on paper, the most logical one. But we need to give it some limits on concurrency.

> Note: Xen Orchestra can be connected to multiple pools at once. So the concurrency number applies **per pool**.

Each step has its own concurrency to fit its requirements:

* **snapshot process** needs to be performed with the lowest concurrency possible. 2 is a good compromise: one snapshot is fast, but a stuck snapshot won't block the whole job. That's why a concurrency of 2 is not too bad on your storage. Basically, at 3 AM, we'll do all the VM snapshots needed, 2 at a time.
* **disk export process** is bottlenecked by XCP-ng/XenServer - so to get the most of it, you can use up to 12 in parallel. As soon a snapshot is done, the export process will start, until reaching 12 at once. Then as soon as one in those 12 is finished, another one will appear until there is nothing more to export.
* **snapshot deletion** can't happen all at once because the previous step durations are random - no need to implement concurrency on this one.

This is how it currently works in Xen Orchestra. But sometimes, you also want to have *sequential* backups combined with the *parallel strategy*. That's why we introduced a sequential option in the advanced section of backup-ng:


> Note: 0 means it will be fully **parallel** for all VMs.

If you job contains 50 VMs for example, you could specify a sequential backup with a limit of "25 at once" (enter 25 in the concurrency field). This means at 3 AM, we'll do 25 snapshots (2 at a time), then exports. As soon as the first VM backup is completely finished (snapshot removed), then we'll start the 26th and so on, to always keep a max of 25x VM backups going in parallel.