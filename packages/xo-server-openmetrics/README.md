<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# xo-server-openmetrics

> XO Server plugin exposing metrics in OpenMetrics/Prometheus format

## Usage

Exposes XenServer/XCP-ng metrics in OpenMetrics/Prometheus format.

Like all other xo-server plugins, it can be configured directly via
the web interface, see [the plugin documentation](https://docs.xen-orchestra.com/advanced#openmetrics--prometheus-integration).

This plugin creates an HTTP server that exposes a `/metrics` endpoint compatible with Prometheus scraping. All metrics are enriched with human-readable labels (pool_name, host_name, vm_name, etc.) for easy filtering and visualization.

**Features:**

- Real-time metrics from all connected pools
- Host metrics: CPU, memory, network, disk IOPS/throughput/latency
- Host uptime metric (`xcp_host_uptime_seconds`)
- Host status metric (`xcp_host_status`) with `power_state` and `enabled` labels, including non-running hosts
- VM status metric (`xcp_vm_status`) with `power_state` label, including non-running VMs
- VM uptime metric (`xcp_vm_uptime_seconds`) for running VMs
- VM metrics: CPU, memory, network, disk, runstate
- `is_control_domain` label on all VM metrics to distinguish dom0 from user VMs
- VDI disk size metrics: virtual size and physical usage per VDI (`xcp_vdi_virtual_size_bytes`, `xcp_vdi_physical_usage_bytes`)
- Bearer token authentication
- OpenMetrics format with EOF marker

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

[AGPL-3.0-or-later](https://spdx.org/licenses/AGPL-3.0-or-later) © [Vates SAS](https://vates.fr)
