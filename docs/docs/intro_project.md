---
slug: project
sidebar_label: About
---

# About Xen Orchestra

Xen Orchestra is an Open Source project with more than 15 years of history. Originated by [Olivier Lambert](https://www.linkedin.com/in/olivier-lambert-22316b26/), co-founder of [Vates](https://vates.tech), it quickly became a collective effort: today a dedicated team of around 20 people designs, develops and maintains it full time at Vates, alongside a worldwide community of users and contributors.

## Milestones {#initial-idea}

- **2009**: the original idea is announced on the [Xen user mailing list](https://lists.xenproject.org/archives/html/xen-users/2009-09/msg00537.html). This first incarnation targets Xen and `xend` (both now long deprecated).
- **December 2012**: the project is rebooted on top of XAPI for XenServer, with the first commit of the current codebase.
- **February 2014**: XO 3.0, the first release of the rebooted project.
- **May 2015**: XO 4.0, with a fully redesigned web interface.
- **June 2016**: XO 5.0, the first release of the generation still known today as [XO 5](xo6/xo6vsxo5.md).
- **2018**: after Citrix closed a lot of XenServer features, Olivier Lambert launched [XCP-ng](https://xcp-ng.org), a fully open source fork of XenServer: successful Kickstarter campaign in early 2018, first release (XCP-ng 7.4) on March 31, 2018.
- **2022**: work starts on [XO Lite](https://docs.vates.tech/products/add-ons/xo-lite), the lightweight web UI embedded in every XCP-ng host.
- **January 2023**: first preview of [V2V](xo5/v2v-migration-guide.md), the built-in tool to migrate VMs directly from VMware to XCP-ng.
- **November 2025**: XO 5.113, the last feature release of the 5.x series.
- **December 2025**: XO 6.0, the first official release of the new [XO 6](xo6/gettingstarted.md) interface, becomes the default UI.
- **February 2026**: XO 6.2 introduces [distributed backups](distributed_backups.md), spreading backup data across multiple backup repositories (BR).
- **March 2026**: XO 6.3 brings symmetrical replication and a rewritten immutable backup engine.
- **May 2026**: XO 6.5 delivers QCOW2 general availability (disks beyond the 2 TiB VHD limit), bidirectional replication and traffic rules on networks and VIFs.
- **July 2026**: XO 6.7 focuses on Rolling Pool Update reliability and keeps expanding the XO 6 workflows.

### The reboot story {#xo-reboot-for-xcp-ngxenserver}

The 2012 reboot was "pushed" thanks to Lars Kurth, and Xen Orchestra has also been a commercial project backed by a dedicated team since 2016. Here is a video from LinuxCon 2013 telling the story:

<iframe width="560" height="315" src="https://www.youtube.com/embed/TT2Q5l2K54k" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

## Part of the Vates VMS stack {#xcp-ng}

Xen Orchestra is the management and backup layer of the [Vates Virtualization Management Stack (VMS)](https://vates.tech), alongside the [XCP-ng](https://xcp-ng.org) hypervisor. Both are developed by [Vates](https://vates.tech) and are fully open source: professional support for the whole platform is delivered through the stack, from the hypervisor to the management layer. See the [Vates documentation](https://docs.vates.tech) for the full picture.

## Feedback and issues

- **Product feedback and feature requests**: [feedback.vates.tech](https://feedback.vates.tech/)
- **Bugs**: tracked on the [GitHub repository](https://github.com/vatesfr/xen-orchestra/issues), but it is always better to first drop a message on the forum, in the [Xen Orchestra section](https://xcp-ng.org/forum/category/12/xen-orchestra)

## Team and contributors

See the [dedicated GitHub page](https://github.com/vatesfr/xen-orchestra/graphs/contributors) for all contributors.
