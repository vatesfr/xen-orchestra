# Load balancing

> Load balancing is a feature coming for Q2 2016.

The goal here is to **distribute the VMs load** in the best way possible on your servers.

Because Xen Orchestra is connected to [multiple pools](xo-server.md) and XenServer supports [live storage motion](https://www.citrix.com/content/dam/citrix/en_us/documents/products-solutions/storage-xenmotion-live-storage-migration-with-citrix-xenserver.pdf?accessmode=direct), we can make load balancing on a **whole XenServer infrastructure** (even between remote Data Centers).

A load balancing policy is called a "**plan**".

## Configure a plan

In this coming new view, you'll be able to configure a new load balancing plan, or to edit an existing one.

A plan has:

* a name
* pool(s) where to apply the policy
* a mode (see paragraph below)
* a behavior (aggressive, normal, low)

### Plan modes

There is 3 modes possible:

* performance
* density
* mixed

#### Performance

VMs are placed to use all possible resources. This means balance the load to give the best overall performance possible. This tends to use all hosts available to spread the load.

#### Density

This time, the objective is to use less hosts as possible, and to concentrate your VMs. In this mode, you can choose to shutdown unused (and compatible) hosts.

#### Mixed

This mode allows you to use both performance and density, but alternatively, depending of a schedule. E.g:

* "performance" from 6:00 AM to 7:00 PM
* "density" from 7:01 PM to 5:59 AM

In this case, you'll have best of both when needed (energy saving during the night and performance during the day).

### Behavior

You can choose between "aggressive", "normal" and "low". This parameter will act on how the plan will activate migrations.

More aggressive it is, more it will make actions to follow the mode, comparing to short term metrics.

Less aggressive means actions only if older metrics confirm that migrating is necessary.

## More

The issue is [opened here](https://github.com/vatesfr/xo-web/issues/423).

![](loadbalancer.jpg)

* `xo-analysis` get stats from `xo-server` and build reports/alerts
* `xo-director` get reports/alerts
* `xo-director` migrate VMs from various hosts (and even stop "useless" hosts)


## External resources

Citrix WLB Admin guide: http://docs.citrix.com/content/dam/docs/en-us/xenserver/xenserver-60/XenServer-6.0.0-wlb-userguide.pdf