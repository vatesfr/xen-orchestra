---
sidebar_position: 1
---

# How it works

This page explains what the SDN controller does and how it builds its networks. Read it before [setting up the controller](./setup.md): the requirements and the choices you make at creation (encapsulation, encryption, MTU, preferred center) follow from it.

## What is the SDN controller?

An SDN controller (Software-Defined Networking controller) manages software network switches from a central place. Each XCP-ng host runs its own virtual switch, Open vSwitch (OVS). A single OVS bridge works well on its own, but to build a network that spans several hosts, someone has to configure all their bridges together, and keep them consistent when hosts and VMs come and go.

In Xen Orchestra, that someone is the **SDN controller plugin**. On XOA, it requires a Vates VMS subscription that includes it. It runs inside `xo-server`, so there is no extra appliance to deploy, and it provides:

- **Private networks**, pool-wide or cross-pool: one isolated layer 2 network for VMs spread across several hosts, and even across pools in different locations.
- **Encryption** of these networks, with IPsec.
- **Traffic rules**: allow or block traffic per VIF, or network-wide. They are covered on their own page: [Traffic rules](./traffic-rules.md).

<Schema label="One private network spanning two sites" legend={[["#6aabf0", "XO"], ["#8e83fe", "XCP-ng"], ["#5ac8c8", "private network tunnels"]]} maxWidth="640px">
<svg viewBox="0 0 640 260" role="img" aria-label="The SDN controller in Xen Orchestra builds encrypted GRE or VxLAN tunnels between the hosts of two pools in different locations, forming a single private network for the VMs">
  <rect x="280" y="10" width="80" height="34" rx="8" fill="rgba(106,171,240,0.12)" stroke="#6aabf0"/>
  <text x="320" y="27" fontSize="12.5" fill="#6aabf0" textAnchor="middle">XO</text>
  <text x="320" y="39" fontSize="8.5" fill="#7a8699" textAnchor="middle">SDN controller</text>
  <g className="schema-flow" stroke="#7a8699" strokeWidth="1.3" strokeDasharray="5 4">
    <line x1="292" y1="44" x2="160" y2="70"/>
    <line x1="348" y1="44" x2="480" y2="70"/>
  </g>
  <g fill="none" stroke="rgba(255,255,255,0.22)" strokeDasharray="6 5">
    <rect x="25" y="70" width="270" height="160" rx="10"/>
    <rect x="345" y="70" width="270" height="160" rx="10"/>
  </g>
  <g fontSize="12" fill="#7a8699">
    <text x="41" y="92">Pool 1 · Paris</text>
    <text x="361" y="92">Pool 2 · Amsterdam</text>
  </g>
  <g fill="rgba(142,131,254,0.1)" stroke="#8e83fe" strokeOpacity="0.8">
    <rect x="45" y="102" width="115" height="86" rx="6"/>
    <rect x="175" y="102" width="115" height="86" rx="6"/>
    <rect x="365" y="102" width="115" height="86" rx="6"/>
    <rect x="495" y="102" width="115" height="86" rx="6"/>
  </g>
  <g fontSize="10" fill="#8e83fe" textAnchor="middle">
    <text x="102" y="119">Host 1</text>
    <text x="232" y="119">Host 2</text>
    <text x="422" y="119">Host 3</text>
    <text x="552" y="119">Host 4</text>
  </g>
  <g fill="rgba(86,194,136,0.14)" stroke="#56c288">
    <rect x="60" y="132" width="85" height="34" rx="4"/>
    <rect x="190" y="132" width="85" height="34" rx="4"/>
    <rect x="380" y="132" width="85" height="34" rx="4"/>
    <rect x="510" y="132" width="85" height="34" rx="4"/>
  </g>
  <g fontSize="10.5" fill="#c6d2e1" textAnchor="middle">
    <text x="102" y="152">VM</text>
    <text x="232" y="152">VM</text>
    <text x="422" y="152">VM</text>
    <text x="552" y="152">VM</text>
  </g>
  <g className="schema-flow" stroke="#5ac8c8" strokeWidth="1.6" strokeDasharray="5 4">
    <line x1="102" y1="188" x2="102" y2="210"/>
    <line x1="232" y1="188" x2="232" y2="210"/>
    <line x1="422" y1="188" x2="422" y2="210"/>
    <line x1="552" y1="188" x2="552" y2="210"/>
    <line x1="102" y1="210" x2="552" y2="210"/>
  </g>
  <text x="320" y="203" fontSize="9" fill="#5ac8c8" textAnchor="middle">WAN</text>
  <text x="320" y="248" fontSize="9.5" fill="#7a8699" textAnchor="middle">encrypted GRE / VxLAN tunnels · one L2 network for all these VMs</text>
</svg>
</Schema>

## What is a private network? {#private-network}

Without the SDN controller, XCP-ng can only create a private network on a single host: VMs of that host can talk to each other, but the network can't follow a VM migrated to another host, and it disappears if the host goes down.

A private network created by the SDN controller is:

- **reachable** by all the hosts of its pools, and by the VMs plugged into it, wherever they run;
- **isolated**: nothing outside the network can reach it;
- **self-maintained**: it follows the changes of the pools (hosts added, rebooted or removed, VMs started, stopped or migrated) without any action on your side.

Typical uses are links that should never be exposed: between an application and its database, a management or backup network, or a cluster interconnect spread across two sites.

## How a private network is built {#how-it-is-built}

To build a private network, the controller uses two connections:

- **XAPI**, to the pool master: it creates the network object of the pool and a tunnel on each host. A tunnel is a virtual PIF, carried over a physical interface you choose (the _transport_ interface).
- **OVSDB**, to the Open vSwitch database of **each host**, over TLS on port `6640`: it adds to the network's bridge the ports and interfaces that connect the hosts to each other. The host listens passively, and the controller's CA certificate is installed on the pool through XAPI, so only a controller signed by that CA can connect.

The hosts are then connected with **GRE** or **VxLAN** tunnels, in a **star topology**: one host is elected **star center**, and every other host has a single tunnel to it. A star is simpler and more robust than a full mesh: a mesh would create loops, and would require the Spanning Tree Protocol to break them.

<Schema label="A pool-wide private network: XAPI to the master, OVSDB to every host, tunnels to the star center" legend={[["#6aabf0", "XAPI"], ["#7a8699", "OVSDB (TLS, port 6640)"], ["#5ac8c8", "GRE / VxLAN tunnels"]]} maxWidth="660px">
<svg viewBox="0 0 660 340" role="img" aria-label="The SDN controller in Xen Orchestra talks to the pool master over XAPI and to the Open vSwitch database of every host over OVSDB. Hosts 1, 3, 4 and 5 each have a single GRE or VxLAN tunnel to host 2, the elected star center">
  <rect x="30" y="157" width="120" height="50" rx="8" fill="rgba(106,171,240,0.12)" stroke="#6aabf0"/>
  <text x="90" y="179" fontSize="12.5" fill="#6aabf0" textAnchor="middle">XO</text>
  <text x="90" y="194" fontSize="9" fill="#7a8699" textAnchor="middle">SDN controller</text>
  <g fill="none" stroke="#7a8699" strokeWidth="1.1">
    <polyline points="90,157 90,16 580,16 580,70"/>
    <line x1="150" y1="174" x2="245" y2="106"/>
    <line x1="150" y1="184" x2="385" y2="184"/>
    <line x1="150" y1="196" x2="245" y2="266"/>
    <polyline points="90,207 90,330 580,330 580,294"/>
  </g>
  <line x1="150" y1="164" x2="245" y2="92" stroke="#6aabf0" strokeWidth="1.6"/>
  <text x="168" y="120" fontSize="10" fill="#6aabf0">XAPI</text>
  <text x="97" y="140" fontSize="9.5" fill="#7a8699">OVSDB</text>
  <text x="97" y="232" fontSize="9.5" fill="#7a8699">OVSDB</text>
  <g transform="translate(0,22)">
    <rect x="215" y="15" width="430" height="275" rx="10" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.22)" strokeDasharray="6 5"/>
    <text x="631" y="280" fontSize="12" fill="#7a8699" textAnchor="end">Pool</text>
    <g className="schema-flow" stroke="#5ac8c8" strokeWidth="1.8" strokeDasharray="5 4">
      <line x1="355" y1="92" x2="400" y2="138"/>
      <line x1="525" y1="92" x2="480" y2="138"/>
      <line x1="355" y1="228" x2="400" y2="182"/>
      <line x1="525" y1="228" x2="480" y2="182"/>
    </g>
    <g fill="rgba(142,131,254,0.1)" stroke="#8e83fe" strokeOpacity="0.8">
      <rect x="245" y="48" width="110" height="44" rx="6"/>
      <rect x="525" y="48" width="110" height="44" rx="6"/>
      <rect x="245" y="228" width="110" height="44" rx="6"/>
      <rect x="525" y="228" width="110" height="44" rx="6"/>
    </g>
    <rect x="385" y="138" width="110" height="44" rx="6" fill="rgba(90,200,200,0.12)" stroke="#5ac8c8" strokeWidth="1.6"/>
    <g fontSize="11" fill="#c6d2e1" textAnchor="middle">
      <text x="300" y="68">Host 1</text>
      <text x="580" y="74">Host 3</text>
      <text x="440" y="157">Host 2</text>
      <text x="300" y="254">Host 4</text>
      <text x="580" y="254">Host 5</text>
    </g>
    <text x="300" y="82" fontSize="9" fill="#7a8699" textAnchor="middle">pool master</text>
    <text x="440" y="172" fontSize="9" fill="#5ac8c8" textAnchor="middle">star center</text>
  </g>
</svg>
</Schema>

With VxLAN, each private network also gets its own VxLAN Network Identifier (VNI), so that Open vSwitch can carry the traffic of several networks in the same tunnels without mixing them.

## How the network is maintained {#maintenance}

Once the star is built, most changes need nothing from the controller: when a VM starts, stops or migrates, or a VIF is plugged or unplugged, Open vSwitch handles it on its own. Same when a host stops or a tunnel is unplugged: OVS removes the corresponding ports and interfaces.

The controller steps in for the rest:

- **A host is added to a pool**, or **a stopped host starts again**: the controller creates or plugs its tunnel and connects it to the star center.
- **The star center goes down**, or its tunnel is unplugged: since every tunnel goes through it, the controller **elects a new star center** among the hosts still available, and rebuilds the star around it.

By default, the first available host is elected. You can give a network a **preferred center** when you create it: the controller elects that host whenever it is available. It's useful to put the center on your most reliable host, or on the site that has the most VMs on the network.

## Cross-pool private networks {#cross-pool}

A private network can span several pools, even in different locations, as long as their hosts can reach one another. Each pool gets its own network object (they share the same private network UUID), and the controller keeps **a single star** across all of them: one star center for the whole private network, and one tunnel from every other host of every pool to it.

<Schema label="A cross-pool private network: one star center for all the pools" legend={[["#8e83fe", "XCP-ng hosts"], ["#5ac8c8", "GRE / VxLAN tunnels"]]} maxWidth="660px">
<svg viewBox="0 0 660 280" role="img" aria-label="Three pools share one private network. Host 4, in pool 2, is the star center, and each of the six other hosts of the three pools has a single tunnel to it">
  <g fill="none" stroke="rgba(255,255,255,0.22)" strokeDasharray="6 5">
    <rect x="15" y="12" width="190" height="255" rx="10"/>
    <rect x="235" y="12" width="190" height="255" rx="10"/>
    <rect x="455" y="12" width="190" height="255" rx="10"/>
  </g>
  <g fontSize="12" fill="#7a8699" textAnchor="middle">
    <text x="110" y="256">Pool 1</text>
    <text x="330" y="256">Pool 2</text>
    <text x="550" y="256">Pool 3</text>
  </g>
  <g className="schema-flow" stroke="#5ac8c8" strokeWidth="1.8" strokeDasharray="5 4">
    <line x1="158" y1="70" x2="282" y2="122"/>
    <line x1="158" y1="182" x2="282" y2="140"/>
    <line x1="330" y1="62" x2="330" y2="113"/>
    <line x1="330" y1="200" x2="330" y2="149"/>
    <line x1="502" y1="70" x2="378" y2="122"/>
    <line x1="502" y1="182" x2="378" y2="140"/>
  </g>
  <g fill="rgba(142,131,254,0.1)" stroke="#8e83fe" strokeOpacity="0.8">
    <rect x="62" y="52" width="96" height="34" rx="6"/>
    <rect x="62" y="166" width="96" height="34" rx="6"/>
    <rect x="282" y="28" width="96" height="34" rx="6"/>
    <rect x="282" y="200" width="96" height="34" rx="6"/>
    <rect x="502" y="52" width="96" height="34" rx="6"/>
    <rect x="502" y="166" width="96" height="34" rx="6"/>
  </g>
  <rect x="276" y="113" width="108" height="36" rx="6" fill="rgba(90,200,200,0.12)" stroke="#5ac8c8" strokeWidth="1.6"/>
  <g fontSize="11" fill="#c6d2e1" textAnchor="middle">
    <text x="110" y="73">Host 1</text>
    <text x="110" y="187">Host 2</text>
    <text x="330" y="49">Host 3</text>
    <text x="330" y="128">Host 4</text>
    <text x="330" y="221">Host 5</text>
    <text x="550" y="73">Host 6</text>
    <text x="550" y="187">Host 7</text>
  </g>
  <text x="330" y="142" fontSize="9" fill="#5ac8c8" textAnchor="middle">star center</text>
</svg>
</Schema>

For the hosts and the VMs, nothing differs from a pool-wide private network: VMs on the network reach each other whatever their pool, and keep doing so when they migrate between hosts or pools of the network. If the star center goes down, a new one is elected among all the hosts of all the pools, and the star is rebuilt around it.

:::tip
In a cross-pool network, all the traffic between two sites goes through the star center. Set the [preferred center](#maintenance) on a host of the site that hosts most of the VMs, to keep most of the traffic local.
:::

## Encryption {#encryption}

The tunnels of a private network can be encrypted with **IPsec**, so that its traffic can cross networks you don't trust, such as the Internet between two sites. Open vSwitch handles it on each host (the `openvswitch-ipsec` package), with a pre-shared key that the controller generates for each tunnel.

## Encapsulation and MTU {#mtu}

GRE and VxLAN both wrap each packet of the private network into a new packet, sent over the transport interface. This encapsulation adds a header to every packet: with the default MTU of `1500` on the transport interface, the private network can't carry full-size `1500`-byte packets. Either the VMs use a smaller MTU, or the transport network carries larger packets. The [setup page](./setup.md#mtu) gives the values.

## Next step

You are ready to [set up the SDN controller](./setup.md).
