---
sidebar_position: 3
---

# Traffic rules

Traffic rules let you allow or block traffic on a VM's virtual interface (VIF), without touching anything inside the guest: for example to isolate VMs that share a subnet or a VLAN. They are enforced by the SDN controller, which writes them as OpenFlow rules into the Open vSwitch of the hosts.

This page covers the **default mode**, available as soon as the [SDN controller plugin is enabled](./setup.md#configuration). An optional mode, with more capabilities but still in beta, is described in [Reference and advanced configuration](./advanced.md#xapi-plugin).

## Requirements and limitations {#requirements}

In the default mode, the SDN controller talks directly to Open vSwitch through the OpenFlow protocol:

- Xen Orchestra must reach the hosts on **TCP port `6653`** (OpenFlow). XAPI opens this port automatically.
- Rules are set **per VIF** only.
- Rules only work on VIFs of the host's **physical management network**: not on a bond, nor on a VLAN.

## Add a rule {#add-a-rule}

In XO 5, go to the **Network** tab of a VM. Each VIF has a **Network rules** column:

- The **Add rule** button opens a form to create a rule, where you choose:
  - whether to **allow or block** the matching traffic;
  - a **protocol** (optional);
  - a **port** (optional);
  - an **IP address or IP range** (optional);
  - the **direction**: coming from the VIF, going to the VIF, or both.
- The **Show rules** button displays all the rules of the VIF, with a button to delete each of them.

<UiDetail src="/img/xo5/add-rule.png" alt="The Add rule form: allow or deny, protocol, port, IP range, direction" width={480} />

<UiDetail src="/img/xo5/show-rules.png" alt="All the rules of a VIF, with a delete button for each" width={700} />

For more background, see the [devblog about VIF traffic rules](https://xen-orchestra.com/blog/vms-vif-network-traffic-control/).

## Going further {#going-further}

The default mode covers per-VIF rules on the management network. If you need any of the following, look at the [XAPI plugin mode](./advanced.md#xapi-plugin):

- **network-wide** rules;
- rules on **bonds, VLANs and private networks**;
- **rule priorities**;
- the [XO 6 traffic rules](../management.md#traffic-rules) interface, with a consolidated view of all the rules of a pool.

:::warning
The XAPI plugin mode is still in **beta**, only works on XCP-ng, and switching to it can't be undone without deleting your rules. Read [its caveats](./advanced.md#xapi-plugin) before switching.
:::
