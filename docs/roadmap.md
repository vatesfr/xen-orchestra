# Roadmap

The goal of this document is to give you a hint on what's next. However, since all topics are very complex, there's no real order or target date.

## In tech preview

This means some parts of the following features are already available, but only partially.

- [XO Lite](https://xcp-ng.org/forum/topic/5018/xo-lite-building-an-embedded-ui-in-xcp-ng): a small/light version of Xen Orchestra bundled inside your XCP-ng host.
- Public REST API

## In progress

In this list, it means work started on those features, but it's not yet available to test.

- [XO 6](https://xen-orchestra.com/blog/devblog-3-working-on-xo-6/): a big revamp of Xen Orchestra: improved speed, security, lazy loading, XO tasks, a brand new UI and much more!
- Auto backup validation: a special "auto restore" task to check if the backuped VM boots
- OVA export
- Individual VDI restore

## In design/PoC phase

This is the initial concept phase, where we discuss the general approach and how to make it real.

- Block based backup (NBD): using NBD as backend to export VMs. Faster and allowing fun features, like compression and dedup.
- XO Resource scheduler: improvement of the existing XO load balancer
- Fetch Netbox to display available IPs
- Packer plugin for XO API

## Backlog

A short non-ordered list of interesting features or ideas to develop at some point.

- Improve XO proxies for complete XAPI reverse role
- Container as first class citizen: allow container management/creation/cycle from XO
- k8s integration: improving integration with Kubernetes inside Xen Orchestra
- Upload ISO to NFS ISO SR via XO (XAPI modification likely required)
- Health check smart service from xen-orchestra.com
- Geo/Async backup
- Native backup encryption
