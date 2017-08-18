## Disperse type

Data are chunked and dispered on multiple nodes. There is a kind of "parity" data allowing to lost one or mode nodes ("like" RAID 5 or RAID 6).

Pros:

* good capacity (perfect for **HDD storage**)
* simple to setup
* simple to maintain
* various level of protection

Cons:

* not all configrations possible (3, 5, 6 nodes and more)
* limited performances on SSDs (replication is better in this case)

![pictore disperse principle]()

### Disperse 3

This is similar to **RAID 5**: there is an [algorithm](https://en.wikipedia.org/wiki/Reed%E2%80%93Solomon_error_correction) that will generate a kind of parity, being able to continue to work even if 1 node is down. If you reintroduce the node, it will be "healed" automatically.

![picture disperse 3]()

If you lose one node, your data are still here. This mode will give you **66% of your total disk space**.

### Disperse 5

Same than 3, like **RAID 5**, you can lose 1 node without service interruption.

![picture disperse 5]()

In this case, you'll be able to use up to **80%** of your total storage capacity!

### Disperse 6

It's very similar to **RAID 6**. You can lose up to 2 nodes, it will continue to work in read and write.

![picture disperse 6]()

## Growing a disperse XOSAN

You can grow a replicated XOSAN by adding extra disperse volumes, in other words a new disperse will be like in RAID 0 with the old one. It's a distributed-disperse type. Some examples:

* To grow a disperse 3, you need 3 new nodes. You'll add the total capacity of each disperse to make a distributed-disperse on 2x3 dispersed nodes.
* To grow a disperse 6, you need 6 new nodes.
