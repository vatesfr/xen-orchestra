<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# xo-server-perf-alert

> Sends alerts based on performance criteria

## Usage

Like all xo-server plugins, it can be configured directly via
the web interface, see [the plugin documentation](https://xen-orchestra.com/docs/plugins.html).

Monitors can be defined in the plugin configuration. These can monitor the storage usage of your SRs, the CPU usage or memory usage of your hosts and VMs.

A separate alarm is created for each monitored element. This alarm will be raised when an element exceeds the defined threshold (on average during the last minute), and it will be lowered when it falls back below the threshold. An email alert is sent in both of those cases, and also if a problem is encountered when trying to access the stats of a monitored element.

To ensure that each alert email is only sent once, the boolean state of each alarm is stored with an ID, e.g. `host|memoryUsage|40|803c2676-c309-721e-7123-e6c3de854c32` is the ID corresponding to the alarm that is raised when host `803c2676-c309-721e-7123-e6c3de854c32` exceeds 40% memory usage.

You can use the "Test plugin" option to receive an email containing the list of the monitors you have configured, and the status of the elements monitored.

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

[AGPL-3.0-or-later](https://spdx.org/licenses/AGPL-3.0-or-later) © [Vates SAS](https://vates.fr)
