# SDN Controller

> SDN Controller is available on XOA 5.44 and higher

The SDN Controller enables a user to **create pool-wide and cross-pool** (since XOA 5.48.1) **private networks**.

## How does it work?

Please read the [dedicated devblog on the SDN Controller](https://xen-orchestra.com/blog/xo-sdn-controller/) and its [extension for cross-pool private networks](https://xen-orchestra.com/blog/devblog-3-extending-the-sdn-controller/).

## Usage

### Network creation

In the network creation view:
- Select a `pool`
- Select `Private network`
- Select on which interface to create the network's tunnels
- Select the encapsulation: choice is offer between `GRE` and `VxLAN`, if `VxLAN` is chosen, then the port 4789 must be open for UDP traffic on all the network's hosts (see [the requirements](#requirements))
- Select other `pool`s to add them to the network if wanted
  - For each added `pool`: select the interface on which to create the tunnels
- Create the network
- Have fun! ☺

### Configuration

Like all other xo-server plugins, it can be configured directly via
the web interface, see [the plugin documentation](https://xen-orchestra.com/docs/plugins.html).

The plugin's configuration contains:
- `cert-dir`: A path where to find the certificates to create SSL connections with the hosts.
If none is provided, the plugin will create its own self-signed certificates.
- `override-certs`: Whether or not to uninstall an already existing SDN controller CA certificate in order to replace it by the plugin's one.

## Requirements

> All requirements are matched in an up to date XCP-ng.
> On older XCP-ng or on Citrix Hypervisor, changes might be done manually.

To be able to use `VxLAN`, the following line needs to be added, if not already present, in `/etc/sysconfig/iptables` of all the hosts where `VxLAN` is wanted:
- `-A xapi-INPUT -p udp -m conntrack --ctstate NEW -m udp --dport 4789 -j ACCEPT`