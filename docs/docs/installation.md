---
sidebar_label: Installation
---

# Installing XOA

Deploying Xen Orchestra takes a few minutes: you deploy the **Xen Orchestra Appliance (XOA)**, a pre-built VM with everything configured, directly on one of your hosts. Nothing is installed on the hosts themselves, and nothing changes in your infrastructure: XOA is just another VM.

This page walks the whole journey: deploy, first login, registration, and the first console and network settings. If you prefer building from the sources instead, the community method has [its own page](install-from-sources.md).

## Deploy XOA {#xoa}

Log in to your account and use the deploy form on [vates.tech/deploy](https://vates.tech/deploy/):

<UiShot light="/img/xoa/deploy-form.png" alt="The XOA deploy form: everything runs between your browser and your host" url="https://vates.tech/deploy/" />

:::tip
All the deploy code runs within your browser: nothing is sent to our servers. Your credentials and host details never leave your network.
:::

The wizard walks four steps: **Connect** (your host address and credentials), **Configure** (storage and network for the appliance, DHCP or static), **Secure**, and **Deploy**. It then imports and starts the VM on the storage repository you picked:

<UiDetail src="/img/xoa/deploy-wizard.png" alt="The four deploy steps: connect to your primary host, configure, secure, deploy" width={620} />

## XOA specifications and sizing {#xoa-vm-specifications}

By default, the deployed VM is configured with:

- 2 vCPUs
- 2 GiB of RAM
- 20 GiB of free SR space (2 GiB on thin provisioned SR)

### Sizing your XOA {#sizing}

The right size depends on what you ask of it:

| Usage                                                       | vCPUs  | RAM                    |
| ----------------------------------------------------------- | ------ | ---------------------- |
| A few pools, no backup jobs, no V2V                         | 2      | 2 GiB (strict minimum) |
| Enterprise usage (backup jobs, V2V, more pools)             | 4      | 4 GiB minimum          |
| Working at scale (large infrastructure, heavy backup load)  | 4 to 8 | 8 GiB                  |

A few rules of thumb:

- **2 GiB and 2 vCPUs is the strict minimum**, fine for a few pools without backups or V2V.
- As soon as you use XOA in an enterprise context, **4 GiB and 4 vCPUs** should be your baseline.
- **8 GiB** is better when working at scale, and **8 vCPUs** can bring extra speed when you run a lot of backups (transfers and compression are parallel workloads).
- You can always give more, but **measure** afterwards to check the improvement is real before going further.

## First login

Once the VM is running, open its IP address in your browser. If you did not set a fixed IP or are unsure which one it got:

<Terminal shell title="host — find the XOA IP">{`xe vm-list params=name-label,networks | grep -A 1 XOA`}</Terminal>

or check your router's DHCP leases for an `xoa` entry.

- Default web UI credentials: `admin@admin.net` / `admin`. Change them right after the first login: create a new admin account and remove this one. If you ever lose your password, you can [reset the configuration](troubleshooting.md#reset-the-configuration) to get the default credentials back.
- Console and SSH have **no default password**: you set one during deployment, or later [from the host](#first-console-connection).

## Register and start your trial {#registration}

**The first thing to do** in your new XOA is to register it, from the Updates view: registration is what enables updates and the free 30-day trial. Use your [account.vates.tech](https://account.vates.tech) credentials:

<UiDetail src="/img/xoa/register.png" alt="Registering the appliance from the Updates view" width={520} />

:::tip
Appliance images are not rebuilt every month, unlike Xen Orchestra itself: right after deploying, an update is usually available. Register, update, then explore.
:::

To try everything XO can do, start the trial from the same view ("Start Trial", the green button), and click Upgrade: your appliance runs the complete **Premium** feature set for 30 days.

<UiDetail src="/img/xoa/start-trial.png" alt="Starting the 30-day Premium trial" width={520} />

When the trial ends, the appliance keeps working and simply returns to the Free feature set: you lose no data and no configuration. For system-level settings of the appliance (firewall, NTP, service restart), see [the XOA appliance settings](configuration.md#xoa-appliance).

## Alternative deployment methods {#alternative-install}

Use these when the web deploy form is not an option (no Internet access from the browser, automation, restricted environments).

### Via XO Lite

If your hosts run XCP-ng 8.3 or later, [XO Lite](https://docs.vates.tech/products/add-ons/xo-lite) is already waiting on every host: open `https://your-host-ip` in a browser, log in with the host `root` credentials, and use its **Deploy XOA** action. Nothing to download, nothing to install: XO Lite is served directly by the host.

### Via a bash script

From your XCP-ng or XenServer host:

<Terminal shell title="host — deploy XOA with the script">{`bash -c "$(wget --no-verbose -O- https://xoa.io/deploy)"`}</Terminal>

The script asks for the IP configuration (DHCP by default, or a fixed address with netmask, gateway and DNS) and imports the XOA VM into your default storage repository. It writes nothing else on the host, and you can move the VM elsewhere afterwards.

:::note
On old XCP-ng or XenServer versions, HTTPS may fail with an SSL error (`SSL23_GET_SERVER_HELLO`). You can fall back to plain HTTP: `bash -c "$(wget --no-verbose -O- http://xoa.io/deploy)"`.
:::

### Via a manual XVA download

Download the XOA as an XVA file from [xen-orchestra.com](https://xen-orchestra.com), then import it from your host CLI (or from XO Lite):

<Terminal shell title="host — import the appliance">{`xe vm-import filename=xoa_unified.xva`}</Terminal>

<Terminal shell title="host — start it">{`xe vm-start vm="XOA"`}</Terminal>

To set a fixed IP address before the first start:

<Terminal shell title="host — optional static IP">{`xe vm-param-set uuid="$uuid" \\
  xenstore-data:vm-data/ip="$ip" \\
  xenstore-data:vm-data/netmask="$netmask" \\
  xenstore-data:vm-data/gateway="$gateway"`}</Terminal>

And to replace the default DNS server:

<Terminal shell title="host — optional custom DNS">{`xe vm-param-set uuid="$uuid" xenstore-data:vm-data/dns="$dns"`}</Terminal>

## First console connection

If you deployed with the [web form](https://vates.tech/deploy/), you already chose the `xoa` user password. Otherwise, **there is no default password, for security reasons**: set one from your host, using the XOA VM UUID (found with `xe vm-list`):

<Terminal shell title="host — set the xoa user password">{`xe vm-param-set uuid=<UUID> xenstore-data:vm-data/system-account-xoa-password='MyPassW0rd!'`}</Terminal>

Reboot the VM to apply, then connect with `ssh xoa@<XOA IP>`.

Once connected, `sudo -s` gives you a root shell, so you do not have to prefix every administration command:

<Terminal title="xoa — a root shell">{`sudo -s
[sudo] password for xoa:`}</Terminal>

## Network configuration

XOA uses **DHCP** by default. To switch to a static address, run `xoa network static` and answer the prompts; `xoa network dhcp` goes back to DHCP:

<Terminal title="xoa — static IP configuration">{`xoa network static
? Static IP for this machine 192.168.100.120/24
? Gateway 192.168.100.254
? IP of the DNS server 192.168.100.254`}</Terminal>

Xen Orchestra is then available at `https://your-vm-ip`.

To configure another interface than the default one, pass its name as an argument (`xoa network static enX1`, `xoa network dhcp enX1`). To add more IP addresses on an already configured interface, use the `--add` flag:

<Terminal title="xoa — add a secondary IP address">{`xoa network static --add
? Static IP for this machine 192.168.200.120/24`}</Terminal>

## From the sources {#from-the-sources}

Xen Orchestra is fully open source and can also be built from its sources, without professional support. This community installation method has [its own dedicated page](install-from-sources.md).
