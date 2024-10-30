# Roadmap

The goal of this document is to give you a hint of what's next. However since all topics are very complex, there's no specific order or target date.

## In tech preview

This means some parts of the following features are already available, but only partially.

- XO Lite: a small/light version of Xen Orchestra bundled inside your XCP-ng host.
- XO 6: a large revamp of Xen Orchestra with improved speed, security, lazy loading, XO tasks, a brand new UI and much more!
- Project Pyrgos: easy k8s cluster creation
- XO Tasks: track all actions via XO tasks and not only XAPI tasks

![](https://xen-orchestra.com/blog/content/images/size/w1600/2023/05/Desktop---Pool-dashboard---Default.png)

## In progress

Items in this list are already undergoing development, but are not yet available to test.

- CBT to reduce the snapshot life and therefore reducing the coalesce needed on a storage
- Better backup reports

## In design/PoC phase

This is the initial concept phase, where we discuss the general approach and how to make the feature real:

- Packer plugin for XO API (already working for XCP-ng API)
- Firewall orchestration to provide adaptive/automated network segmentation
- More automation in DR cases

## Backlog

A short non-ordered list of interesting features or ideas to develop eventually:

- AWS Glacier support
- Tape support
