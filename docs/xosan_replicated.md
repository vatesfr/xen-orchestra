## Replicated type

Data are replicated from a node to another.

Pros:

* fast (**must be used for SSDs**)
* relatively flexible

Cons:

* lower capacity (so higher cost, better for SSDs)
* a bit more complex to maintain in distributed-replicated (see "RAID 10 like")

### 2-way replication

This type is pretty simple to understand: everything written on one node is mirrored to another one. It's very similar to **RAID 1**.

![picture replication]()

If you lose one node, your data are still here. This mode will give you **50% of your total disk space** (e.g with 2x nodes of 250GiB, you'll have only 250GiB of space).

### 3-way replication

Same than 2-way, but data is replicated on 3 nodes in total.

![picture triplication]()

2 nodes can be destroyed without losing your data. This mode will give you **33% of your total disk space** (e.g with 3x nodes of 250GiB, you'll have only 250GiB of space).

### Building a "RAID 10" like

If you have more than 2 or 3 nodes, it could be interesting to **distribute** data on multiple replicated nodes. This is called "**distributed-replicated**" type. Here is an example with 6 nodes:

![picture distributed-replicated with 6 nodes]()

It's very similar to **RAID 10**.

> This is the mode you'll use in a more than 3 nodes setup.

### Examples

Here is some examples depending of the number of XenServer hosts.

#### 2 hosts

This is a kind of special mode. On a 2 nodes setup, one node must know what's happening if it can't contact the other node. This is called a **split brain** scenario. To avoid data loss, it goes on read only. But there is a way to overcome this, with a special node, called **the arbiter**. It will only require an extra VM using only few disk space.

Thanks to this arbiter, you'll have 3 nodes running on 2 XenServer hosts:

* if the host with 1 node is down, the other host will continue to provide a working XOSAN
* if the host with 2 nodes (1 normal and 1 arbiter) id down, the other node will go into read only mode, to avoid split brain scenario.

This way, in all cases, you are protected.

#### 3 hosts

The easiest way is to use 3-way replication. You can lose completely 2 hosts, it will continue to work on the survivor!

#### 4 hosts

The usual deal is to create a "group" of 2 replicated nodes (2x2). In a picture:

![2x2 replication]()

#### 5 hosts

There is no way to use the local disks of 5 nodes in a replicated type. So you'll use 4 hosts in XOSAN, and the 5th would be also able to use the shared XOSAN SR, without participating directly to it.

![2x2 replication and 1 extra node]()

#### 6 hosts

You have 2 choices:

1. 2-way replication on 3 nodes (2x3)
2. 3-way replication on 2 nodes (3x2)

There is more fault tolerance on mode 2, but less space usable. It's up to you!

![2x3 vs 3x2 modes]()

## Growing a replicated XOSAN

You can grow a replicated XOSAN by adding pairs, in other words "RAID 1"-like mirrors to the existing setup, like you would adds mirrored disks in "RAID 10" setup. Examples:

* on a 2 hosts setup, going for 4 hosts by adding 2 mirrored nodes
* on a 3 hosts setup using 3-way replication, by adding 3 mirrored nodes
