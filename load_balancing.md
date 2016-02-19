# Load balancing

> Load balancing is a feature coming for Q2 2016.

The goal here is to **distribute the VMs load** in the best way possible on your servers.

Because Xen Orchestra is connected to [multiple pools](xo-server.md) and XenServer supports [live storage motion](https://www.citrix.com/content/dam/citrix/en_us/documents/products-solutions/storage-xenmotion-live-storage-migration-with-citrix-xenserver.pdf?accessmode=direct), we can imagine load balancing on a **whole XenServer infrastructure** (even between remote Data Centers).

## First challenges

We are already capable to gather the metrics from all the hosts and VMs. But we need now to:

* analyze the global load
* detect bottlenecks
* compare to user limits
* act accordingly

There is also a lot of unknown parameters:

* a live storage motion could be very long on remote DC if your bandwidth is low
* avoid to made worse than no load balancing (this is easier than you think!)

The issue is [opened here](https://github.com/vatesfr/xo-web/issues/423).

## Steps

![](loadbalancer.jpg)

* `xo-analysis` get stats from `xo-server` and build reports/alerts
* `xo-director` get reports/alerts
* `xo-director` migrate VMs from various hosts (and even stop "useless" hosts)


## Resources

The Citrix WLB Admin guide: http://docs.citrix.com/content/dam/docs/en-us/xenserver/xenserver-60/XenServer-6.0.0-wlb-userguide.pdf