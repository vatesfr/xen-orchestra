# Disaster recovery

Disaster Recovery (DR) regroup all the means to recover after losing hosts or storage repositories.

In this documentation, we'll only see the technical aspect of DR, which is a vast topic.

## Best practices

We strongly encourage you to read some literature on this very topic. Basically, you should be able to recover a major disaster with appropriate amount of time and minimal acceptable data loss.

To avoid a potentially very long import process (restoring all your backup VMs), we created a specific feature. This is possible thanks to the XO capability to [stream export and import on the same time](https://xen-orchestra.com/blog/vm-streaming-export-in-xenserver/).

![](https://xen-orchestra.com/blog/content/images/2015/10/newsolution.png)

## Schedule a DR task

