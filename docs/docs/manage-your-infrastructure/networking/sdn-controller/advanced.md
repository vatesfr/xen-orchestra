---
sidebar_position: 4
---

# Reference and advanced configuration

This page gathers what you only need in specific cases: the optional XAPI plugin mode for traffic rules, the migration to it, and the certificate regeneration required by OpenSSL 3 on XCP-ng 8.3. For a first setup, start with [How it works](./how-it-works.md) and [Set up the SDN controller](./setup.md).

## XAPI plugin mode for traffic rules {#xapi-plugin}

By default, the SDN controller sets [traffic rules](./traffic-rules.md) by talking directly to Open vSwitch through the OpenFlow protocol. In the XAPI plugin mode, it goes through a XAPI plugin on the XCP-ng side, which configures Open vSwitch itself.

:::warning
A few caveats:

- This is still in **beta** and should not be used in production yet.
- It only works on XCP-ng, not on XenServer hosts.
- It's not enabled by default: it requires a configuration change for `xo-server` (`useDirectChannel = false`). See [the configuration page](../../../getting-started/configuration.md#sdn-controller-mode).
- Switching is forward only: going back to the default mode deletes the rules. See [Migrate from the default mode](#migration-path).
:::

:::tip
This is the mode used by the [XO 6 traffic rules interface](../../management.md#traffic-rules) (since XO 6.5): network-wide and per-VIF rules, with a consolidated view in the pool **Traffic rules** tab.
:::

Compared to [the default mode](./traffic-rules.md), it:

- works on any network:
  - Networks bound to physical interface as well as bonds
  - VLAN on top of any network
  - Private networks and cross-pool private networks
- supports per-VIF **and** network-wide rules;
- supports rule priorities.

### Manage the rules {#xapi-plugin-rules}

- From the **XO 6** interface: see [Traffic rules in XO 6](../../management.md#traffic-rules).
- From the **XO 5** interface: per-VIF rules only, exactly as in [the default mode](./traffic-rules.md#add-a-rule): only the backend changes.
- From the [REST API](../../../automation/restapi.md), which can also update rules in place (since XO 6.7).
- From `xo-cli`, described below.

### Manage the rules with xo-cli {#xo-cli}

First, register xo-cli to your XOA instance as documented in [its documentation](../../../core-concepts/architecture.md#xo-cli). Then:

- Add per-VIF rules: `xo-cli sdnController.addRule vifId=<VIF_UUID> <parameters>`
- Delete per-VIF rules: `xo-cli sdnController.deleteRule vifId=<VIF_UUID> <parameters>`
- Add new network-wide rules: `xo-cli sdnController.addNetworkRule networkId=<NETWORK_UUID> <parameters>`
- Delete network-wide rules: `xo-cli sdnController.deleteNetworkRule networkId=<NETWORK_UUID> <parameters>`

Parameters:

- _ipRange_: An IP or range of IPs in CIDR notation (for example `192.168.1.0/24`). An IP does not need `/32`.
- _direction_:
  - _to_: means the parameters for **port** and **ipRange** are to be used as destination.
  - _from_: means they will be used as source.
  - _from/to_ or _to/from_: 2 rules will be created (one per direction).
- _protocol_: IP, TCP, UDP, ICMP or ARP (case-insensitive).
- _port_: required for TCP/UDP protocol. Use `json:22` so the number is passed as an integer.
- _allow_: true or false. If set to false the packets are dropped.
- _priority_ (optional): the OpenFlow priority of the rule, an integer from 1 to 65535 (XAPI reserves 0), refused when `useDirectChannel` is enabled. A rule without one has the OpenFlow default, 32768. When several rules of a network match a packet, network-wide and per-VIF rules alike, the one with the **highest** priority applies: a rule of priority 30 applies before a rule of priority 20. Two rules of a network can't be given the same priority. To delete a rule that has a priority, you must pass that priority to `sdnController.deleteRule` or `sdnController.deleteNetworkRule` as well.

:::tip
Leave room between the priorities of your rules (for example 100, 110, 120…) rather than numbering them one after the other (101, 102, 103…): a new rule can then go between two existing ones without renumbering them.
:::

Some examples:

<Terminal shell title="per-VIF rules">{`
xo-cli sdnController.addRule vifId=15f1a9ec-4348-0cca-d2b8-e536db043298 direction=from ipRange=1.1.1.3 protocol=tcp port=json:4242 allow=false priority=json:100
xo-cli sdnController.deleteRule vifId=15f1a9ec-4348-0cca-d2b8-e536db043298 direction=from ipRange=1.1.1.3 protocol=tcp port=json:4242 priority=json:100
xo-cli sdnController.addRule vifId=e9a7914a-9518-82e2-7052-42cb16cc9724 direction=to ipRange=1.1.1.2 protocol=icmp allow=false priority=json:110
xo-cli sdnController.deleteRule vifId=e9a7914a-9518-82e2-7052-42cb16cc9724 direction=to ipRange=1.1.1.2 protocol=icmp priority=json:110
`}</Terminal>

<Terminal shell title="network-wide rules">{`
xo-cli sdnController.addNetworkRule networkId=9334aa83-6960-62e5-a463-5acc05295af4 direction=to ipRange=1.1.1.2 protocol=icmp allow=false priority=json:200
xo-cli sdnController.deleteNetworkRule networkId=9334aa83-6960-62e5-a463-5acc05295af4 direction=to ipRange=1.1.1.2 protocol=icmp priority=json:200
xo-cli sdnController.addNetworkRule networkId=9334aa83-6960-62e5-a463-5acc05295af4 direction=from ipRange=1.1.1.2 protocol=tcp allow=false port=json:4242 priority=json:210
xo-cli sdnController.deleteNetworkRule networkId=9334aa83-6960-62e5-a463-5acc05295af4 direction=from ipRange=1.1.1.2 protocol=tcp port=json:4242 priority=json:210
`}</Terminal>

## Migrate from the default mode {#migration-path}

The default (OpenFlow) mode and the XAPI plugin mode implement traffic rules in slightly different ways, so their rules are not directly interchangeable. When you [switch to the XAPI plugin mode](../../../getting-started/configuration.md#sdn-controller-mode), you must either:

1. Re-create the rules from scratch, or
2. Use the provided migration script to translate an existing set of rules.

:::note
The migration is forward only. You can go from the default mode to the XAPI plugin mode semi-automatically. Going back restores the backed-up rules, but deletes the existing ones first.
:::

### What the migration script does

- Back up the current rules of the default mode in the `rules-channel.json` file.
- Translate those rules into the XAPI plugin mode format.

If you ever need to go back to the original configuration, the same script can restore the rules from the backup.
Existing rules will first be removed before restoring the saved ones.

### How to use the script

The migration script is available as [sdn-migration.py (download script)](../../../../static/sh/sdn-migration.py).

<Terminal shell title="migrate the rules (backup written to rules-channel.json)">{`
# Export current rules to rules-channel.json and convert to XAPI format
python3 sdn-migration.py migrate

# (Optional) Restore original rules (from rules-channel.json file)
python3 sdn-migration.py restore
`}</Terminal>

## OpenSSL 3 and certificates {#openssl-3-sdn-upgrade-path}

With OpenSSL 3 arriving in XCP-ng 8.3, the certificates previously generated by the Xen Orchestra SDN Controller plugin will no longer work. **You must regenerate the certificates before updating your XCP-ng pools.** The steps below only cover certificate regeneration: updating your XCP-ng pools is a separate operation that you perform as you normally would, after the certificates are in place.

:::warning
We remind you that the self-signed certificates generated by Xen Orchestra’s SDN Controller plugin are a workaround. **They are neither safe nor recommended**. You should provide your own certificates.
:::

### Are you impacted?

This only applies to you if you meet **all of the following requirements:**

- One of your pools is using our **Global Private Network** (VxLAN or GRE tunnels) or the **VIF Traffic Rules**.
- The SDN Controller plugin is enabled in **Xen Orchestra → Settings → Plugins**.
- You’re not providing your own certificates.
- You’re using the `override-cert` option (shown when clicking the `+` button of the SDN Controller plugin).

:::info
Standard networks and VLAN are not related to the SDN Controller and are **not impacted**.
:::

#### How to check if your pools use these features?

To check if you’re using **Global Private Networks**, you can use one of the methods below.

##### Method 1: Use a script

We provide a script to run from a host that has access to your pool. To run the script, you will need the following:

- A machine to run it that has access to your pools. Your XOA may be a good place.
- The list of the addresses of your pool masters.
- (optional) If your infrastructure is on the bigger side, it may be better to have ssh agents configured with keys to avoid the need to pass all the passwords.

[check-sdn-features.sh (download script)](../../../../static/sh/check-sdn-features.sh)

Copy the file to where you want to run the script, then run this:

<Terminal shell title="check every pool master">{`
bash check-sdn-features.sh <pool-master-ip1> [pool-master-ip2] [pool-master-ip3] ...
`}</Terminal>

The script will connect to those masters and check:

- if an SDN Controller is connected
- if there are tunnels
- if there are traffic rules configured

It will then print a summary letting you know if there are using features that require a manual intervention.

##### Method 2: Check manually

Alternatively, you can check manually in Xen Orchestra’s interface:

- For **Global Private Networks**: Go to the **Pool → Network** tab, and check for tunnelX PIFs, note that the search field is looking at the name of the network (not the PIF) so you can’t filter with that.
- For **VIF Traffic Rules**: Go to the **VM → Network** tab and look for the “eye” icon under the traffic rule column.

### Manual Regeneration Procedure

If you did the previous check and confirm you’re using the SDN Controller features, you will unfortunately need a manual intervention before the March XCP-ng 8.3 update.

There are 3 cases here:

- You’re using the `latest` channel of Xen Orchestra Appliance.
- You’re using the `stable` channel of Xen Orchestra Appliance.
- You run Xen Orchestra from sources.

:::warning
We recommend doing this right before updating Xen Orchestra Appliance, or you’ll need to restart the `xo-server` again manually.
:::

#### Latest Channel

This is the simplest case. We have updated the self-signed certificates to work with the incoming OpenSSL 3. All you need is to remove the current certificates, start the update, and you’re good to go. The certificates will be regenerated and copied over to your hosts.

:::tip
We suggest doing a backup of the certificates in case anything goes wrong:

<Terminal shell title="back up the current certificates, on your XOA">{`
today=$(date +%Y%m%d)
sudo mkdir /var/lib/xo-server/data/sdn-controller/$today-backup
sudo mv /var/lib/xo-server/data/sdn-controller/*.pem /var/lib/xo-server/data/sdn-controller/$today-backup
`}</Terminal>

:::

Finally, update your XOA. On next restart, `xo-server` will regenerate the certificates and push them to your hosts automatically. You can then update your XCP-ng pools as you normally would.

#### Stable Channel

The update present in the `latest` channel will probably be available later than the XCP-ng 8.3 update (March 2026) that will include OpenSSL 3. In that case, you need to actually generate certificates yourself, then restart `xo-server`.

We provide a helper script to run on your XOA VM:

[regenerate-certs.sh (download script)](../../../../static/sh/regenerate-certs.sh)

<Terminal shell title="regenerate the certificates, on your XOA">{`
sudo bash -e ./regenerate-certs.sh
# if you have available updates, just update XOA, otherwise:
sudo systemctl restart xo-server
`}</Terminal>

Once `xo-server` is back up, the new certificates are pushed to your hosts. You can then update your XCP-ng pools as you normally would.

#### Running from sources

If you have auto-updates from master, you likely already are in a case similar to people using the `latest` channel and already have the updated certificate generation.

1. You need to find where your xo-server's data folder lives.
2. Move or remove your certificates.
3. Restart xo-server.

If for any reason you’re pinning xen-orchestra to a specific release, you can use the `regenerate-certs.sh` as an insipration. However, be sure to adjust it to your installation (xo-server’s data folder, permission…). Then, you can restart `xo-server` with your distribution service manager.

Once `xo-server` is back up, the new certificates are pushed to your hosts. You can then update your XCP-ng pools as you normally would.
