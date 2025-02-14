<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# xo-server-sdn-controller

> Creates pool-wide and cross-pool private networks

## Usage

XO Server plugin that allows the creation of pool-wide and cross-pool private networks, a bit similar to [XenServer's DVCS](https://www.knowcitrix.com/posts/distributed-virtual-switch-controller-dvsc/).

Please see the plugin's [official documentation](https://xen-orchestra.com/docs/sdn_controller.html).

# Features

- create pool-wide or cross-pool private networks
- add OpenFlow rules to VMs

# Architecture

- `private-network`: logic for private networks
- `protocol`:
  - `openflow-channel.js`: protocol to manage OpenFlow rules
  - `ovsdb-client.js`: protocol to manage private networks
- `utils/tls-helper.js`: small class to create connections using TLS

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

[AGPL-3.0-or-later](https://spdx.org/licenses/AGPL-3.0-or-later) © [Vates SAS](https://vates.fr)
