# Advanced features

This section is dedicated to all others Xen Orchestra "advanced features".

## Live Telemetry

When you are working on your virtualized infrastructure, you might need a very detailed view on what's going on. From resource consumption analysis (CPU/RAM) to network traffic, but also storage, having a kind of very detailed dashboard per host can be really useful.

:::tip
This feature will be only available in XCP-ng+XOA. If you are a hardcore Citrix Hypervisor user, let us know if you want this.
:::

### Enable Advanced Live Telemetry for a host

Go into the Advanced host view:

![](https://xen-orchestra.com/blog/content/images/2019/11/advancedenable.png)

By clicking here, XOA will handle everything: installing netdata on the host, and configure a secured/encrypted streaming toward your XOA.

As soon it's installed, the button will now be replaced by a "Go to Advanced Live Telemetry". As soon you'll click on it, you'll be redirected to the netdata page of the host. If you have multiple host, you can access any of them directly from the top menu of the netdata UI.

### Examples

IMPI info (power, temperatures, voltages, fans…):

![](https://xen-orchestra.com/blog/content/images/2019/11/ipmistats.png)

:::tip
This feature is only available in one-click in your XOA. However, all sources and packages to do it yourself are available!
:::

Memory details:

![](https://xen-orchestra.com/blog/content/images/2019/11/memorystats.png)

Firewall:

![](https://xen-orchestra.com/blog/content/images/2019/11/firewallstats.png)

## Hardware Monitoring

### Disk Health Monitoring

Xen Orchestra makes it easy to monitor disk health using a XAPI plugin for XCP-ng that leverages `smartctl`. You can check the status of your disks directly in the interface.

- **Healthy Disks:** If all disks are in good condition, Xen Orchestra shows: **All disks are healthy ✅**.
- **Unhealthy Disks:** If any issues are detected, a warning icon appears, indicating how many disks are affected:

![](../static/img/disk-health-warning.png)

## Web hooks

:::warning
We need your feedback on this feature!
:::

### Configuration

The plugin "web-hooks" needs to be installed and loaded for this feature to work.

You can trigger an HTTP POST request to a URL when a Xen Orchestra API method is called or when a backup job runs.

- Go to Settings > Plugins > Web hooks
- Add new hooks
- For each hook, configure:
  - Method: the XO API method that will trigger the HTTP request when called. For backup jobs, choose `backupNg.runJob`.
  - Type:
    - pre: the request will be sent when the method is called
    - post: the request will be sent after the method action is completed
    - pre/post: both
  - URL: the full URL which the requests will be sent to
  - Wait for response: you can choose to wait for the web hook response before the method is actually called ("pre" hooks only). This can be useful if you need to automatically run some tasks before a certain method is called.
- Save the plugin configuration

From now on, a request will be sent to the corresponding URLs when a configured method is called by an XO client.

### Request content

```
POST / HTTP/1.1
Content-Type: application/json
```

The request's body is a JSON string representing an object with the following properties:

- `type`: `"pre"` or `"post"`
- `callId`: unique ID for this call to help match a pre-call and a post-call
- `userId`: unique internal ID of the user who performed the call
- `userName`: login/e-mail address of the user who performed the call
- `method`: name of the method that was called (e.g. `"vm.start"`)
- `params`: call parameters (object)
- `timestamp`: epoch timestamp of the beginning ("pre") or end ("post") of the call in ms
- `duration`: duration of the call in ms ("post" hooks only)
- `result`: call result on success ("post" hooks only)
- `error`: call result on error ("post" hooks only)

### Request handling

_Quick Node.js example of how you may want to handle the requests_

```js
const http = require('http')
const { exec } = require('child_process')

http
  .createServer((req, res) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk
    })
    req.on('end', () => handleHook(body))
    res.end()
  })
  .listen(3000)

const handleHook = data => {
  const { method, params, type, result, error, timestamp } = JSON.parse(data)

  // Log it
  console.log(`${new Date(timestamp).toISOString()} [${method}|${type}] ${params} → ${result || error}`)

  // Run scripts
  exec(`./hook-scripts/${method}-${type}.sh`)
}
```

## Alerts

Alerts are a way to warn the administrator about various events. The first kind of alerts will be emails and also in a dedicated area of `xo-web` to display them.

### Performance alerts

The administrator will configure alerts based on performance thresholds.

The configurable metrics are:

- CPU usage (VM, host)
- RAM usage (VM, host)
- network bandwidth (VM, host)
- load average (host)
- disk IO (VM)
- total IO (SR, only for XenServer Dundee and higher)

If any configured values exceed the threshold during a selected period of time, an alert will be sent.

Those alerts will be also stored and accessible in the web interface, and also later for the load balancing feature (helping it to solve those performance problems).

### Update alerts

:::warning
:construction_worker: This feature might be missing. We are investigating. :construction_worker:
:::

When your XOA detects new packages, you'll be notified by email.

### Backup alerts

Same story for backups: if a backup fails, you'll receive an email.

You can choose to be notified only if it fails or even after each backup job.

Current supported alerts system:

- Email
- XMPP

## Job manager

The key idea is to be able to schedule any action (migrate, reboot etc.), for things like backups, snapshots or DR actions.

In the main menu, go to the "Job Manager" section:

![](./assets/jobmanager.png)

You can now **schedule all actions** on your hosts, VMs, or ACLs. It's configured in 2 steps:

1. Create a job
1. Schedule it!

Real example, step by step: **Creating a job called "security reboot"** (in this case, restarting "nfs" and "Core1" VMs):

![](./assets/job_create.png)

Note that you can execute this job **now** by clicking on the orange play button (to test it for instance):

![](./assets/job_execute.png)

**Schedule the job** (every Sunday at 5:00 AM):

![](./assets/schedule_job.png)

And that's it! The job is listed in the Overview:

![](./assets/schedule_recap.png)

The possibilities are infinite! You can schedule a **lot** of things (any actions on a VM, like migrate, start, clone, suspend etc. Same thing also applies to hosts).

### Examples

#### Save on your electric bill

- plan a live migration of your VMs at 11:00PM to a less powerful host, then shutdown the big one
- start the big server at 6:00AM and migrate the VMs back 15 minutes later

#### Scale when needed

- schedule the boot of extra VMs during your usual activity spikes (horizontal scaling)
- also add more vCPUs or RAM to these VMs at the same time
- go back to the previous state when your planned load is low (e.g: during the night)

#### Planned reboot

- For example: your client app is not very stable, or you need to reboot every month after kernel updates: schedule this during the weekend!

#### Add or Remove ACLs

- revoke your user ACLs Friday at 11:00PM (e.g: no access on the weekend)
- restore them Monday at 6:00AM

## Emergency Shutdown

If you have a UPS for your hosts, and lose power, you may have a limited amount of time to shut down all of your VM infrastructure before the batteries run out. If you find yourself in this situation, or any other situation requiring the fast shutdown of everything, you can use the **Emergency Shutdown** feature.

### How to activate

On the host view, clicking on this button will trigger the _Emergency Shutdown_ procedure:

![](./assets/e-shutdown-1.png)

1.  **All running VMs will be suspended** (think of it like "hibernate" on your laptop: the RAM will be stored in the storage repository).
2.  Only after this is complete, the host will be halted.

Here, you can see the running VMs are being suspended:

![](./assets/e-shutdown-2.png)

And finally, that's it. They are cleanly shut down with the RAM saved to disk to be resumed later:

![](./assets/e-shutdown-3.png)

Now the host is halted automatically.

### Powering back on

When the power outage is over, all you need to do is:

1.  Start your host.
2.  All your VMs can be resumed, your RAM is preserved and therefore your VMs will be in the exact same state as they were before the power outage.

## Terraform provider

Terraform is a cloud/platform agnostic tool for building, changing, and versioning infrastructure. Terraform can manage existing and popular service providers as well as custom in-house solutions (like Xen Orchestra). It can manage resources through their entire lifecycle or even manage infrastructure it didn't initially create.

We sponsored a developer to build a [Xen Orchestra provider for Terraform](https://registry.terraform.io/providers/vatesfr/xenorchestra/latest), so you can use it as a central point for your whole virtualized infrastructure. The source code is [available on GitHub](https://github.com/vatesfr/terraform-provider-xenorchestra/), and contributions are welcome!

:::tip
Don't miss [our blog post series about it](https://xen-orchestra.com/blog/author/ddelnano/), written by Dom Del Nano, the original developer of this provider!
:::

It works with few steps:

1. Install terraform
2. Create a VM template for the new VM
3. Provision the VM with terraform and its XO provider

From there, you can even manage your existing resources with Terraform!

## Netbox

Synchronize your pools, VMs, network interfaces and IP addresses with your [Netbox](https://docs.netbox.dev/en/stable/) instance.

![](./assets/netbox.png)

## Supported versions

- `>= 2.10`
- `3.x`
- `< 4.5`

:::tip
For safety, XO will not synchronize your pools if it detects a Netbox version that is not supported. If you wish to change that behavior, edit you `xo-server` configuration like so:

```toml
[netbox]
checkNetboxVersion = false
```

Please be aware that by doing this, a Netbox update might make XO delete some of your data in Netbox.
:::

### Netbox side

- Go to your Netbox interface
- Configure prefixes:
  - Go to IPAM > Prefixes > Add
  - Manually create as many prefixes as needed for your infrastructure's IP addresses

:::warning
XO will try to find the right prefix for each IP address. If it can't find a prefix that fits, the IP address won't be synchronized.
:::

- Create permissions:
  - Go to Admin > Permissions > Add and create 2 permissions:
    - "XO read" with action "Can view" enabled and object types:
      - Extras > custom field
      - IPAM > prefix
    - "XO read-write" with all 4 actions enabled and object types:
      - DCIM > platform
      - Extras > tag
      - IPAM > IP address
      - Tenancy > tenant (if you want to synchronize XO users with Netbox tenants)
      - Virtualization > cluster
      - Virtualization > cluster type
      - Virtualization > virtual machine
      - Virtualization > interface

![](./assets/netbox-permissions.png)

- Create a Netbox user:
  - Go to Admin > Users > Add
  - Choose a username and a password
  - Scroll down to Permissions and select the 2 permissions "XO read" and "XO read-write"
- Create an API token:
  - Got to Admin > API Tokens > Add
  - Select the user you just created
  - Copy the token for the next step
  - Make sure "Write enabled" is checked and create it

:::warning
For testing purposes, you can create an API token bound to a Netbox superuser account, but once in production, it is highly recommended to create a dedicated user with only the required permissions.
:::

- Create a UUID custom field:
  - Go to Customization > Custom Fields > Add
  - Select object types:
    - Tenancy > tenant (if you want to synchronize XO users with Netbox tenants)
    - Virtualization > cluster
    - Virtualization > virtual machine
    - Virtualization > interface
  - Name it "uuid" (lower case!)

![](./assets/customfield.png)

:::tip
In Netbox 2.x, custom fields can be created from the Admin panel > Custom fields > Add custom field.
:::

### In Xen Orchestra

- Go to Xen Orchestra > Settings > Plugins > Netbox and fill out the configuration:
  - Endpoint: the URL of your Netbox instance (e.g.: `https://netbox.company.net`)
  - Unauthorized certificate: only for HTTPS, enable this option if your Netbox instance uses a self-signed SSL certificate
  - Token: the token you generated earlier
  - Pools: the pools you wish to automatically synchronize with Netbox
  - Synchronize users: enable this if you wish to synchronize XO users with Netbox tenants. Tenants will be assigned to the VMs the XO user _created_ within XO. Important: if you want to enable this feature, you also need to assign the custom field "uuid" that you created in the previous step to the type "Tenancy > tenant".
  - Interval: the time interval (in hours) between 2 auto-synchronizations. Leave empty if you don't want to synchronize automatically.
- Load the plugin (button next to the plugin's name)
- Manual synchronization: if you correctly configured and loaded the plugin, a "Synchronize with Netbox" button will appear in every pool's Advanced tab, which allows you to manually synchronize it with Netbox

:::tip
If you get a `403 Forbidden` error when testing the plugin, make sure you correctly configured the "Allowed IPs" for the token you are using.
:::

## Recipes

### What are recipes?

In Xen Orchestra, recipes are ready-to-use automation templates that make it easy to deploy complex infrastructures. You don’t need to configure each virtual machine manually.

With just a few clicks, you can launch a complete multi-VM environment, where all nodes are automatically set up and connected.

:::tip
Currently, the only available recipe is for Kubernetes clusters. [This guide](https://docs.vates.tech/devops-tools/kubernetes/) will walk you through creating one.

Coming soon: We’ll expand the Recipes feature to include EasyVirt DC Scope deployment.
:::

## OpenMetrics / Prometheus Integration

Export your XenServer/XCP-ng infrastructure metrics in OpenMetrics/Prometheus format for monitoring, alerting, and visualization with Grafana.

### Overview

The OpenMetrics plugin exposes a `/metrics` endpoint that Prometheus can scrape to collect real-time metrics from all your connected pools, hosts, and VMs. This enables:

- **Real-time monitoring** of CPU, memory, network, and disk metrics
- **Alerting** based on custom thresholds using Prometheus Alertmanager
- **Visualization** with Grafana dashboards
- **Historical analysis** of infrastructure performance

### Requirements

- Xen Orchestra with Premium license
- Prometheus server (or compatible: Victoria Metrics, Mimir, etc.)
- (Optional) Grafana for visualization

### Plugin Configuration

1. Go to **Settings → Plugins** in Xen Orchestra.
2. Find and enable the **OpenMetrics** plugin.
3. Configure the following options:

| Option                | Default    | Description                                               |
| --------------------- | ---------- | --------------------------------------------------------- |
| **Prometheus secret** | (required) | Bearer token for authentication - you must set this value |

4. Save and load the plugin

:::warning
You must set a **Prometheus secret** before loading the plugin. Without a valid secret, the metrics endpoint authentication is ineffective, potentially exposing sensitive infrastructure data (host resources, VM configurations, network details) to unauthorized access. Use a strong, random string (e.g., generated with `openssl rand -hex 32`).
:::

### Prometheus Configuration

The metrics endpoint is available through xo-server's HTTP proxy at `/openmetrics/metrics`. Add the following job to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'xen-orchestra'
    scrape_interval: 60s
    metrics_path: '/openmetrics/metrics'
    static_configs:
      - targets: ['your-xoa-ip'] # Use port 80 or 443 depending on your XO setup
    authorization:
      type: Bearer
      credentials: 'your-secret-from-plugin-config'
```

:::warning
The metrics endpoint requires authentication. Without a valid Bearer token, requests will receive a 401 Unauthorized response.
:::

### Available Metrics

All metrics are prefixed with `xcp_` and include enriched labels for easy filtering.

#### Host Metrics

| Metric                                  | Type    | Description                             |
| --------------------------------------- | ------- | --------------------------------------- |
| `xcp_host_load_average`                 | gauge   | Host load average                       |
| `xcp_host_memory_free_bytes`            | gauge   | Free memory in bytes                    |
| `xcp_host_memory_total_bytes`           | gauge   | Total memory in bytes                   |
| `xcp_host_cpu_average`                  | gauge   | Average CPU usage (0-1)                 |
| `xcp_host_cpu_core_usage`               | gauge   | Per-core CPU usage                      |
| `xcp_host_network_receive_bytes_total`  | counter | Network bytes received per interface    |
| `xcp_host_network_transmit_bytes_total` | counter | Network bytes transmitted per interface |
| `xcp_host_disk_iops_read`               | gauge   | Disk read IOPS per SR                   |
| `xcp_host_disk_iops_write`              | gauge   | Disk write IOPS per SR                  |
| `xcp_host_disk_throughput_read_bytes`   | gauge   | Disk read throughput (bytes/s)          |
| `xcp_host_disk_throughput_write_bytes`  | gauge   | Disk write throughput (bytes/s)         |
| `xcp_host_disk_read_latency_seconds`    | gauge   | Disk read latency                       |
| `xcp_host_disk_write_latency_seconds`   | gauge   | Disk write latency                      |
| `xcp_host_disk_iowait`                  | gauge   | Disk IO wait ratio                      |

#### VM Metrics

| Metric                                 | Type    | Description                       |
| -------------------------------------- | ------- | --------------------------------- |
| `xcp_vm_memory_bytes`                  | gauge   | Memory usage in bytes             |
| `xcp_vm_memory_internal_free_bytes`    | gauge   | Internal free memory              |
| `xcp_vm_memory_target_bytes`           | gauge   | Memory target                     |
| `xcp_vm_cpu_usage`                     | gauge   | CPU usage ratio                   |
| `xcp_vm_cpu_core_usage`                | gauge   | Per-vCPU usage                    |
| `xcp_vm_runstate_fullrun`              | gauge   | Runstate: full run ratio          |
| `xcp_vm_runstate_blocked`              | gauge   | Runstate: blocked ratio           |
| `xcp_vm_network_receive_bytes_total`   | counter | Network bytes received per VIF    |
| `xcp_vm_network_transmit_bytes_total`  | counter | Network bytes transmitted per VIF |
| `xcp_vm_network_receive_errors_total`  | counter | Network receive errors            |
| `xcp_vm_network_transmit_errors_total` | counter | Network transmit errors           |
| `xcp_vm_disk_read_bytes_total`         | counter | Disk read bytes per device        |
| `xcp_vm_disk_write_bytes_total`        | counter | Disk write bytes per device       |
| `xcp_vm_disk_iops_read`                | gauge   | Disk read IOPS                    |
| `xcp_vm_disk_iops_write`               | gauge   | Disk write IOPS                   |
| `xcp_vm_disk_read_latency_seconds`     | gauge   | Disk read latency                 |
| `xcp_vm_disk_write_latency_seconds`    | gauge   | Disk write latency                |
| `xcp_vm_disk_iowait`                   | gauge   | Disk IO wait ratio                |
| `xcp_vm_disk_inflight`                 | gauge   | In-flight disk operations         |
| `xcp_vm_disk_queue_size`               | gauge   | Disk queue size                   |

#### Connection Metrics

| Metric               | Type  | Description                                          |
| -------------------- | ----- | ---------------------------------------------------- |
| `xcp_pool_connected` | gauge | Pool connection status (1=connected, 0=disconnected) |

#### Labels

All metrics include these labels for filtering:

| Label          | Description                                |
| -------------- | ------------------------------------------ |
| `pool_id`      | Pool UUID                                  |
| `pool_name`    | Pool name                                  |
| `uuid`         | Object UUID (host or VM)                   |
| `type`         | Object type (`host` or `vm`)               |
| `host_name`    | Host name (for host metrics)               |
| `vm_name`      | VM name (for VM metrics)                   |
| `sr_name`      | Storage Repository name (for disk metrics) |
| `vdi_name`     | Virtual Disk name (for VM disk metrics)    |
| `network_name` | Network name (for network metrics)         |
| `interface`    | Network interface name                     |
| `device`       | Disk device (xvda, xvdb, etc.)             |
| `core`         | CPU core number                            |

### PromQL Query Examples

```promql
# Average CPU usage per host
avg by (host_name) (xcp_host_cpu_average) * 100

# Memory usage percentage per VM
(xcp_vm_memory_bytes - xcp_vm_memory_internal_free_bytes)
  / xcp_vm_memory_bytes * 100

# Top 5 VMs by CPU usage
topk(5, xcp_vm_cpu_usage * 100)

# Network throughput per host (MB/s)
rate(xcp_host_network_receive_bytes_total[5m]) / 1024 / 1024

# Disk latency above 10ms
xcp_vm_disk_read_latency_seconds > 0.01

# Total IOPS per Storage Repository
sum by (sr_name) (xcp_host_disk_iops_read + xcp_host_disk_iops_write)
```

### Grafana Integration

#### Creating a Dashboard

1. Add your Prometheus instance as a data source in Grafana.
2. Create a new dashboard.
3. Use the following variables for filtering:

**Pool variable:**

```promql
label_values(xcp_host_cpu_average, pool_name)
```

**Host variable:**

```promql
label_values(xcp_host_cpu_average{pool_name="$pool"}, host_name)
```

**VM variable:**

```promql
label_values(xcp_vm_cpu_usage{pool_name="$pool"}, vm_name)
```

#### Example Panels

**Host CPU Overview:**

```promql
xcp_host_cpu_average{pool_name="$pool"} * 100
```

**VM Memory Usage:**

```promql
xcp_vm_memory_bytes{vm_name="$vm"} / 1024 / 1024 / 1024
```

### Alerting with Alertmanager

Create alerting rules in Prometheus for proactive monitoring:

```yaml
groups:
  - name: xcp-alerts
    rules:
      - alert: HighHostCPU
        expr: xcp_host_cpu_average > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: 'High CPU usage on {{ $labels.host_name }}'
          description: 'Host {{ $labels.host_name }} has CPU usage above 90% for 5 minutes.'

      - alert: HighHostMemory
        expr: (1 - xcp_host_memory_free_bytes / xcp_host_memory_total_bytes) > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: 'High memory usage on {{ $labels.host_name }}'
          description: 'Host {{ $labels.host_name }} memory usage is above 90%.'

      - alert: HighDiskLatency
        expr: xcp_host_disk_read_latency_seconds > 0.05 or xcp_host_disk_write_latency_seconds > 0.05
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: 'High disk latency on {{ $labels.host_name }}'
          description: 'Storage {{ $labels.sr_name }} on {{ $labels.host_name }} has latency above 50ms.'

      - alert: VMHighCPU
        expr: xcp_vm_cpu_usage > 0.95
        for: 10m
        labels:
          severity: info
        annotations:
          summary: 'High CPU on VM {{ $labels.vm_name }}'
          description: 'VM {{ $labels.vm_name }} has sustained high CPU usage.'

      - alert: PoolDisconnected
        expr: xcp_pool_connected == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: 'Pool {{ $labels.pool_name }} disconnected'
          description: 'XO lost connection to pool {{ $labels.pool_name }}.'
```

### Security Recommendations

- **Use strong secrets**: Generate a secure random token (e.g., `openssl rand -hex 32`)
- **Network segmentation**: Ensure only your Prometheus server can reach the metrics endpoint
- **Use HTTPS**: Configure xo-server with TLS or use a reverse proxy (nginx, Caddy) in front of XO

Example nginx reverse proxy configuration (if you need an additional proxy in front of XO):

```nginx
server {
    listen 443 ssl;
    server_name metrics.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location /metrics {
        proxy_pass http://your-xoa-ip/openmetrics/metrics;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Health Check Endpoint

A health check endpoint is available without authentication:

```bash
curl http://your-xoa-ip/openmetrics/health
# Response: {"status":"ok"}
```

### Troubleshooting

**401 Unauthorized:**

- Verify the Bearer token matches the plugin configuration
- Check the `Authorization` header format: `Bearer <token>`

**Connection refused:**

- Ensure the plugin is loaded (check plugin status in UI)
- Verify xo-server is running and accessible

**No metrics returned:**

- Verify pools are connected in Xen Orchestra
- Check xo-server logs: `DEBUG=xo:xo-server-openmetrics* yarn start`
- Ensure the license includes the OpenMetrics feature

**Stale or missing data:**

- RRD data is collected every 60 seconds
- Some metrics require XCP-ng/XenServer tools installed in VMs
- Check individual host connectivity from xo-server
