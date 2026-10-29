---
slug: /getting-started/installation
sidebar_label: XOA
sidebar_position: 1
---

# Installing XOA

Deploying Xen Orchestra takes a few minutes: you deploy the **Xen Orchestra Appliance (XOA)**, a pre-built VM with everything configured, directly on one of your hosts. Nothing is installed on the hosts themselves, and nothing changes in your infrastructure: XOA is just another VM.

This page walks the whole journey: deploy, first login, registration, and the first console and network settings. Not sure XOA is the right choice for you? See [how to choose your installation method](install.md).

Before you start, check the [requirements](../requirements.md): supported hosts and the resources to give to the appliance.

If you are installing XOA to leave VMware, deploy it as described below, then follow the [VMware migration (V2V)](../../migrate-from-vmware/v2v-migration-guide.md) guide: it explains how to prepare both environments and move your VMs to XCP-ng with Xen Orchestra.

## Deploy XOA {#xoa}

Log in to your account and use the deploy form on [vates.tech/deploy](https://vates.tech/deploy/):

<UiShot light="/img/xoa/deploy-form.png" alt="The XOA deploy form: everything runs between your browser and your host" url="https://vates.tech/deploy/" />

:::tip
All the deploy code runs within your browser: nothing is sent to our servers. Your credentials and host details never leave your network.
:::

The wizard walks four steps: **Connect** (your host address and credentials), **Configure** (storage and network for the appliance, DHCP or static), **Secure**, and **Deploy**. It then imports and starts the VM on the storage repository you picked:

<UiDetail src="/img/xoa/deploy-wizard.png" alt="The four deploy steps: connect to your primary host, configure, secure, deploy" width={620} />

## First login

Once the VM is running, open its IP address in your browser. If you did not set a fixed IP or are unsure which one it got:

<Terminal shell title="host — find the XOA IP">{`xe vm-list params=name-label,networks | grep -A 1 XOA`}</Terminal>

or check your router's DHCP leases for an `xoa` entry.

- Default web UI credentials: `admin@admin.net` / `admin`. Change them right after the first login: create a new admin account and remove this one. If you ever lose your password, you can [reset the configuration](../../support-and-reference/troubleshooting.md#reset-the-configuration) to get the default credentials back.
- Console and SSH have **no default password**: you set one during deployment, or later [from the host](#first-console-connection).

## Register and start your trial {#registration}

**The first thing to do** in your new XOA is to register it, from the Updates view: registration is what enables updates and the free 30-day trial. Use your [account.vates.tech](https://account.vates.tech) credentials:

<UiDetail src="/img/xoa/register.png" alt="Registering the appliance from the Updates view" width={520} />

:::tip
Appliance images are not rebuilt every month, unlike Xen Orchestra itself: right after deploying, an update is usually available. Register, update, then explore.
:::

To try everything XO can do, start the trial from the same view ("Start Trial", the green button), and click Upgrade: your appliance runs the complete **Premium** feature set for 30 days.

<UiDetail src="/img/xoa/start-trial.png" alt="Starting the 30-day Premium trial" width={520} />

When the trial ends, the appliance keeps working and simply returns to the Free feature set: you lose no data and no configuration. For system-level settings of the appliance (firewall, NTP, service restart), see [the XOA appliance settings](../configuration.md#xoa-appliance).

## Change the default interface

Starting with **Xen Orchestra 6**, the XO 6 UI becomes the default interface. That said, you can still switch back to XO 5, temporarily or by default.

### Temporary Switch to XO 5

To quickly access the old UI without changing any configuration, `/v5` to your URL (e.g., `https://xo.example.com/v5`).

### Making XO 5 the default UI

To permanently use XO 5 as the default interface, create a new config file (you can call it `config.mounts.toml`). This configuration file can be placed either in `~/.config/xo-server/` of the process running xo-server or if you are using a xoa in `/etc/xo-server/`. This file will contain :

```toml
[http.mounts]
'/' = '/usr/local/lib/node_modules/xo-web/dist/'
'/v5' = '/usr/local/lib/node_modules/xo-web/dist/'
'/v6' = '/usr/local/lib/node_modules/@xen-orchestra/web/dist/'
```

If you are not using a xoa, replace the path `/usr/local/lib/node_modules/` with the real path of the modules.

This configuration ensures:

- Accessing `/` loads **XO 5**.
- Accessing `/v5` loads **XO 5**.
- Accessing `/v6` loads **XO 6**.

For the possible locations of configuration files and the order in which they are loaded, see [Where to place the configuration file](../configuration.md#where-to-place-the-configuration-file).

### Apply the changes

After updating the configuration, restart the XO server process:

<Terminal shell title="xoa — apply the configuration">{`
sudo systemctl restart xo-server
`}</Terminal>

XO 5 will now be served as the default UI.

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
