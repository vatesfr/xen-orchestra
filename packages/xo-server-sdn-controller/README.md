<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# xo-server-sdn-controller

> Creates pool-wide and cross-pool private networks

## Usage

XO Server plugin that allows the creation of pool-wide and cross-pool private networks, a bit similar to [XenServer's DVCS](https://www.knowcitrix.com/posts/distributed-virtual-switch-controller-dvsc/).

Please see the plugin's [official documentation](https://docs.xen-orchestra.com/sdn_controller).

# Features

- create pool-wide or cross-pool private networks
- add OpenFlow rules to VMs

# Architecture

- `private-network`: logic for private networks
- `protocol`:
  - `openflow-channel.js`: manages OpenFlow rules
  - `ovsdb-client.js`: manages private networks
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

## Rest Routes

Some rest api routes are undocumented in the swagger, here is how to use them :

Creates a new rule
POST /vifs/{id}/actions/add_traffic_rule :

### Fields

| Field       | Type                  | Required | Description                                                                                  |
| ----------- | --------------------- | -------- | -------------------------------------------------------------------------------------------- |
| `allow`     | string (boolean-like) | Yes      | Indicates whether the rule allows or denies traffic. Expected values: `"true"` or `"false"`. |
| `direction` | string                | Yes      | Traffic direction the rule applies to. Values: `"from"`, `"to"`, `"both"`.                   |
| `ipRange`   | string                | Yes      | IP address or range. Example: `"111.168.1.2"` or `"111.168.1.0/24"`.                         |
| `port`      | string                | No       | Port or port range. Empty string means all ports. Example: `"80"` or `"1000-2000"`.          |
| `protocol`  | string                | Yes      | Network protocol. Common values: `"TCP"`, `"UDP"`, `"IP"` (any protocol).                    |

Deletes a new rule
POST /vifs/{id}/actions/delete_traffic_rule :

### Fields

| Field       | Type   | Required | Description                                                                         |
| ----------- | ------ | -------- | ----------------------------------------------------------------------------------- |
| `direction` | string | Yes      | Traffic direction the rule applies to. Values: `"from"`, `"to"`, `"both"`.          |
| `ipRange`   | string | Yes      | IP address or range. Example: `"111.168.1.2"` or `"111.168.1.0/24"`.                |
| `port`      | string | No       | Port or port range. Empty string means all ports. Example: `"80"` or `"1000-2000"`. |
| `protocol`  | string | Yes      | Network protocol. Common values: `"TCP"`, `"UDP"`, `"IP"` (any protocol).           |

Creates a new rule at network level
POST /networks/{id}/actions/add_traffic_rule :

### Fields

| Field       | Type                  | Required | Description                                                                                  |
| ----------- | --------------------- | -------- | -------------------------------------------------------------------------------------------- |
| `allow`     | string (boolean-like) | Yes      | Indicates whether the rule allows or denies traffic. Expected values: `"true"` or `"false"`. |
| `direction` | string                | Yes      | Traffic direction the rule applies to. Values: `"from"`, `"to"`, `"both"`.                   |
| `ipRange`   | string                | Yes      | IP address or range. Example: `"111.168.1.2"` or `"111.168.1.0/24"`.                         |
| `port`      | string                | No       | Port or port range. Empty string means all ports. Example: `"80"` or `"1000-2000"`.          |
| `protocol`  | string                | Yes      | Network protocol. Common values: `"TCP"`, `"UDP"`, `"IP"` (any protocol).                    |

Deletes a new rule at network level
POST /networks/{id}/actions/delete_traffic_rule :

### Fields

| Field       | Type   | Required | Description                                                                         |
| ----------- | ------ | -------- | ----------------------------------------------------------------------------------- |
| `direction` | string | Yes      | Traffic direction the rule applies to. Values: `"from"`, `"to"`, `"both"`.          |
| `ipRange`   | string | Yes      | IP address or range. Example: `"111.168.1.2"` or `"111.168.1.0/24"`.                |
| `port`      | string | No       | Port or port range. Empty string means all ports. Example: `"80"` or `"1000-2000"`. |
| `protocol`  | string | Yes      | Network protocol. Common values: `"TCP"`, `"UDP"`, `"IP"` (any protocol).           |
