<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# xo-server-perf-alert

> Sends alerts based on performance criteria

## Usage

Like all xo-server plugins, it can be configured directly via
the web interface, see [the plugin documentation](https://xen-orchestra.com/docs/plugins.html).

You can define monitors in the plugin configuration. Monitors let you check storage usage for your SRs, CPU usage or memory usage of your hosts and VMs.

Each monitored element gets its own alarm. The alarm triggers when an element goes over the defined threshold (based on the average over the last minute) and clears when it drops back below. An email alert is sent when an alarm is raised and when it clears. If there's an issue accessing the stats for a monitored element, an email will be sent too.

To avoid sending duplicate alerts, each alarm's boolean state is stored with a unique ID. For example, `host|memoryUsage|40|803c2676-c309-721e-7123-e6c3de854c32` represents an alarm triggered when host `803c2676-c309-721e-7123-e6c3de854c32` exceeds 40% memory usage.

You can use the "Test plugin" option to get an email listing the monitors you've set up and the current status of each monitored element.

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

[AGPL-3.0-or-later](https://spdx.org/licenses/AGPL-3.0-or-later) © [Vates SAS](https://vates.fr)
