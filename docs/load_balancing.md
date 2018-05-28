# Load balancing

The goal here is to **distribute the VMs load** in the best way possible on your servers.

Because Xen Orchestra is connected to [multiple pools](xo-server.md) and XenServer supports [live storage motion](https://www.citrix.com/content/dam/citrix/en_us/documents/products-solutions/storage-xenmotion-live-storage-migration-with-citrix-xenserver.pdf?accessmode=direct), we can perform load balancing on a **whole XenServer infrastructure** (even between remote datacenters).

A load balancing policy is called a "**plan**".

## Configure a plan

In this coming new view, you'll be able to configure a new load balancing plan, or edit an existing one.

A plan has:

* a name
* pool(s) where to apply the policy
* a mode (see paragraph below)
* a behavior (aggressive, normal, low)

### Plan modes

There are 3 modes possible:

* performance
* density
* mixed

#### Performance

VMs are placed to use all possible resources. This means balance the load to give the best overall performance possible. This tends to use all hosts available to spread the load.

#### Density

This time, the objective is to use the least hosts possible, and to concentrate your VMs. In this mode, you can choose to shutdown unused (and compatible) hosts.

#### Mixed

This mode allows you to use both performance and density, but alternatively, depending of a schedule. E.g:

* **performance** from 6:00 AM to 7:00 PM
* **density** from 7:01 PM to 5:59 AM

In this case, you'll have the best of both when needed (energy saving during the night and performance during the day).

### Threshold

In a plan, you can configure various thresholds:

* CPU threshold
* Free memory

If the CPU threshold is set to 90%, the load balancer will be only triggered if the average CPU usage on a host is more than 90%.

For free memory, it will be triggered if there is **less** free RAM than the threshold.
