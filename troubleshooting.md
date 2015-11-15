# Troubleshooting

This page recap the actions to do if you have any problems with your XOA

## XOA configuration

XOA is a virtual appliance running Debian and Xen Orchestra. If you have any problem, the first thing to do is to check the network configuration.

The easiest step is to check if you can ping our servers:

```
$ ping xen-orchestra.com

PING xen-orchestra.com (*******) 56(84) bytes of data.
64 bytes from xen-orchestra.com (*******): icmp_seq=1 ttl=53 time=11.0 ms
64 bytes from xen-orchestra.com (*******): icmp_seq=2 ttl=53 time=11.0 ms
```

If you have something completely different than that, or error messages, lost packets etc., it means you have problably a network problem. Check the following sections on network and DNS configuration.

### IP configuration

You can see your current network configuration with a `ifconfig eth0`. If you have a firewall, please check that you allow the XOA's IP.

You can modify the IP configuration in `/etc/network/interfaces`.

[Follow the official Debian documentation about that]( https://wiki.debian.org/NetworkConfiguration#Configuring_the_interface_manually).


### DNS configuration

The DNS servers are configured in `/etc/resolv.conf`. If you have problems with DNS resolution, please modify the IPs of those servers to fit your current network configuration.

[Check the official Debian documentation to configure it](https://wiki.debian.org/NetworkConfiguration#The_resolv.conf_configuration_file).


## XO configuration

