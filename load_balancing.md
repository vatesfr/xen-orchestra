# Load balancing

Load balancing is feature coming for the end of 2015. The goal here is to **distribute the VMs load** in the best way possible on your servers.

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