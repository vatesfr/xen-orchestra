---
sidebar_label: Updates
---

# Updating XOA

All updates are pushed through the updater, which is the central piece that keeps your XO Appliance running the latest Xen Orchestra code.

It also allows you to change your current version into another (Free, Starter, Enterprise or Premium) **without downloading a new XOA**.

:::tip
By design, the updater is only available in XOA. If you are using XO from the sources, [update with `git` and rebuild](install-from-sources.md#updating).
:::

:::info Updating from XO 6
Updates are not managed from the XO 6 interface yet. From XO 6, click the **XO 5** link in the top-right corner, then open the **XOA → Updates** view: everything below happens there. Your appliance and both interfaces update together.
:::

## Requirements

In order to work, the updater needs access to `xen-orchestra.com` (port 443) and `nodejs.org` (port 443).

## Usage

The updater is configurable directly from the web interface, or via the CLI.

### From the web interface

The updater is available in the "Update" menu:

<UiDetail src="/img/xoa/update-menu.png" alt="The Updates entry in the XOA menu" width={420} />

You can see the yellow bell icon: it means your appliance is not registered. You **must register in order to have updates and a trial**.

<UiDetail src="/img/xoa/update-tooltip.png" alt="A yellow bell: the appliance is not registered yet" width={420} />

#### Register

Updates and trials will be available as soon as you register your appliance. To register, use your [account.vates.tech](https://account.vates.tech) credentials (your email and your password):

<UiDetail src="/img/xoa/register.png" alt="Registering with your xen-orchestra.com account" width={520} />

#### Check for new versions

The updater will check for new versions periodically. A green tick in the menu means your version is up to date:

<UiDetail src="/img/xoa/update-ok.png" alt="Green tick: the appliance is up to date" width={420} />

However, if you want to start a manual check, you can do it by clicking on the "Update" button:

<UiDetail src="/img/xoa/update-button.png" alt="Trigger a manual check with the Update button" width={420} />

### Release channel

In Xen Orchestra, you can make a choice between two different release channels.

#### Stable ![](https://badgen.net/badge/channel/stable/green)

The stable channel is intended to be a version of Xen Orchestra that is already **one month old** (and therefore will benefit from one month of community feedback and various fixes). This way, users more concerned with the stability of their appliance will have the option to stay on a slightly older (and tested) version of XO (still supported by our pro support).

#### Latest ![](https://badgen.net/badge/channel/latest/yellow)

The latest channel will include all the latest improvements available in Xen Orchestra. The version available in latest has already been QA'd by our team, but issues may still occur once deployed in vastly varying environments, such as our user base has.

:::tip
To select the release channel of your choice, go to the XOA > Updates view:
<UiDetail src="/img/xoa/release-channels.png" alt="Choosing the release channel in the XOA Updates view" width={520} />
:::

### Upgrade

If a new version is found, you'll have an upgrade button and its tooltip displayed:

<UiDetail src="/img/xoa/update-available.png" alt="An upgrade is available" width={420} />

### Proxy configuration

If you are behind a proxy, you can edit your proxy settings in this panel:

<UiDetail src="/img/xoa/proxy-settings.png" alt="Updater proxy settings" width={520} />

### From the CLI

If your interface is not accessible, or you just prefer to use CLIs commands, it's still possible to perform the same steps. You need to access your XOA via SSH (remember the default credentials: xoa/xoa. Change them ASAP).

#### Register

<Terminal title="xoa — register the appliance">{`
xoa-updater --register
Successfully connected to xoa-updater-service

Please enter your xen-orchestra.com identifiers to register your XOA:
? Email: myemail@example.net
? Password: *****

ℹ Your Xen Orchestra Appliance has been successfully registered
`}</Terminal>

#### Check for new versions

<Terminal title="xoa — check for new versions">{`
xoa-updater
Successfully connected to xoa-updater-service
Checking new versions...ok ✔
New versions available:
  xo-server 4.8.1

ℹ xoa-updater may be run again to upgrade packages
`}</Terminal>

#### Upgrade

<Terminal title="xoa — upgrade">{`
xoa-updater --upgrade
Successfully connected to xoa-updater-service
Checking new versions...ok ✔
New versions available:
  xo-server 4.8.1
[...]
Downloading packages...
Installing new packages...

✔ Your XOA has been successfully updated.
`}</Terminal>

## Troubleshooting

If your updater is down, restart it:

<Terminal shell title="xoa — restart the updater">{`
systemctl restart xoa-updater
`}</Terminal>

If you can't fetch updates, perform a few checks from your XOA:

- you should be able to successfully `ping xen-orchestra.com`
- if not, check your `/etc/resolv.conf` file and modify it if necessary (give a correct DNS server)
- use `ifconfig` to check your network configuration
- check your firewall(s) and allow XOA to reach xen-orchestra.com (port 443)

## XenServer updates {#xenserver-updates}

Xen Orchestra can install XenServer hotfixes on your pools directly, from a pool's **Patches** view. Since September 2023, XenServer requires authentication to download hotfixes, so XO needs your **XenServer Client ID** credentials to fetch them on your behalf:

1. Make sure your XenServer hosts have [the proper licenses](https://docs.xenserver.com/en-us/xenserver/8/overview-licensing).
2. Get your Client ID file (`xencenter_client_id.json`), which contains the username and API key XO will use.
3. In Xen Orchestra, open your **User Settings** page (bottom left-hand corner) and upload the file in the "XenServer Client ID" section:

<UiDetail src="/img/xoa/xs-client-id-upload.png" alt="Uploading xencenter_client_id.json in your XO user settings" width={520} />

4. Go to a pool's **Patches** view and install the updates. A `LICENCE_RESTRICTION` error means your hosts are missing XenServer licenses.

:::warning
Citrix removed the self-service Client ID download page from its support portal. If you already have your `xencenter_client_id.json`, XO keeps using it; to obtain new credentials, go through Citrix support. Note that this hotfix mechanism concerns Citrix Hypervisor 8.2 CU1 and older (now end of life): XenServer 8 and 9 hosts fetch their updates themselves from the `ops.xenserver.com` channels, with XO showing the missing patches per pool and host.
:::

:::tip
This authentication story only concerns XenServer. XCP-ng updates are plain RPM repositories, fully handled from Xen Orchestra: see the [XCP-ng updates documentation](https://docs.xcp-ng.org/management/updates/).
:::
