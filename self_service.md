# Self Service

This feature is not yet available yet. Still, we already made efforts to design it.

## Set of resources

To allow people creating VMs as they want, we need to give them a *part* of your XenServer resources (disk space, CPUs, RAM). You can call this "general quotas" if you like. But you need first to decide how those quota applies in your infrastructure:

* which hosts will be available for self-service?
* which Storage Repository?

Details are given in [this GitHub issue](https://github.com/vatesfr/xo-web/issues/285). Feel free to contribute to help up!


## Users quotas

After having the global "frame" for your self-service, you need could be able to give users or groups, a maximum number of vCPUs or RAM etc.

## Toward the Cloud

Self-service leads to other questions:

* what about [network provisioning](https://github.com/vatesfr/xo-web/issues/351)? (IP addresses)
* SSH keys and root partition growing with CloudInit is also a nice possibility