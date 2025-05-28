# SDN Controller

The SDN Controller enables a user to **create pool-wide and cross-pool private networks** and more. It's available as a Xen Orchestra plugin (included in XOA Premium).

## Global Private Networks

Interconnect your VMs and hosts within a dedicated and secured private network, even across different pools all around the world. This is a great way to protect "private links" (eg between applications and databases, management networks etc.) without any complicated deployment.

![](./assets/gpn.png)

### How does it work?

Please read the [dedicated devblog on the SDN Controller](https://xen-orchestra.com/blog/xo-sdn-controller/) and its [extension for cross-pool private networks](https://xen-orchestra.com/blog/devblog-3-extending-the-sdn-controller/).

:::warning
As VxLAN and GRE are protocols using extra encapsulation, they require extra bits on a network packet. If you create a Global Private Network with a default MTU at `1500`, you won't be able to use it "as is" in your VMs, unless you configure a smaller MTU for each virtual interface, in your VM operating system (eg: `1400`).

If you want something entirely transparent for your VMs, then you'll need to create a network with a MTU of `1546` for GRE or `1550` for VxLAN. However, larger MTU will require capable network equipments.
:::

### Network creation

In the network creation view:

- Select a `pool`
- Select `Private network`
- Select an interface on which to create the network's tunnels
- Select the encapsulation: a choice is offered between `GRE` and `VxLAN`, if `VxLAN` is chosen, then port 4789 must be open for UDP traffic on all the network's hosts (see [the requirements](#vxlan))
- Choose if the network should be encrypted or not (see [the requirements](#encryption) to use encryption)
- Select other `pool`s to add them to the network if desired
  - For each added `pool`: select an interface on which to create the tunnels
- Create the network
- Have fun! ☺

![](./assets/sdn-controller.png)

:::tip
- All hosts in a private network must be able to reach the other hosts' management interface and all hosts must be able to reach one another on the interface selected for private networks creation.
  > The term ‘management interface’ is used to indicate the IP-enabled NIC that carries the management traffic.
- Only 1 encrypted GRE network and 1 encrypted VxLAN network per pool can exist at a time due to Open vSwitch limitation.
:::

### Configuration

Like all other xo-server plugins, it can be configured directly via the web interface, see [the plugin documentation](architecture#plugins).

The plugin's configuration contains:

- `cert-dir`: The path where the plugin will look for the certificates to create SSL connections with the hosts.
  If none is provided, the plugin will create its own self-signed certificates.
- `override-certs`: Enable to uninstall the existing SDN controller CA certificate in order to replace it with the plugin's one.

### Requirements

### VxLAN

### Encryption

- To be able to encrypt the networks, `openvswitch-ipsec` package must be installed on all the hosts:
  - `yum install openvswitch-ipsec --enablerepo=xcp-ng-testing`
  - `systemctl enable ipsec`
  - `systemctl enable openvswitch-ipsec`
  - `systemctl start ipsec`
  - `systemctl start openvswitch-ipsec`

## OpenFlow rules

> Warning: only works for VIFs attached to the physical host's management network (no bond nor VLAN).

Please see the [devblog about OpenFlow rules](https://xen-orchestra.com/blog/vms-vif-network-traffic-control/).

This feature requires the OpenFlow port to be opened

In the VM network tab a new column has been added: _Network rules_.

- The _Add rule_ button display a form to add a new rule choosing to:
  - enable/disable the matching traffic
  - for a specific protocol (optional)
  - on a specific port (optional)
  - matching a specific IP or IP range (optional)
  - coming from the VIF / going to the VIF / both
- The _Show rules_ button allow to display all rules for a VIF.
- When the rules are display a button to delete a rule is available.

![](./assets/add-rule.png)
![](./assets/show-rules.png)

:::tip
- This feature requires the OpenFlow port (TCP 6653) to be opened. (See [the requirements](#openflow))
:::

### Requirements

### Openflow