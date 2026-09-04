# Troubleshooting

This page covers the problems you may encounter with your XOA, and how to get out of them.

:::warning
If you have issues with an XO installed [from the sources](install-from-sources.md), please go through the [community support checklist](community.md) first.
:::

## First reflex: `xoa check`

Whenever something feels wrong, start with the built-in check:

<Terminal title="xoa — health check">{`
xoa check
✔ Node version
✔ Disk space for /var
✔ Disk space for /
✔ XOA version
✔ xo-server config syntax
✔ Appliance registration
✔ Internet connectivity
`}</Terminal>

Anything other than a clean list of green ticks (errors, lost packets, missing entries) points at the problem area. Then look for the matching section below, and check the [logs](#logs).

## Deployment issues

### Deploy error: no default SR

> Auto deploy failed. - No SR specified and Pool default SR is null

The pool you are importing XOA on has no default storage repository. Find the UUID of the SR you want:

<Terminal shell title="host — list storage repositories">{`
xe sr-list
`}</Terminal>

then set it as the pool default (press Tab after `uuid=` to autofill your pool UUID):

<Terminal shell title="host — set the default SR">{`
xe pool-param-set uuid=<pool-uuid> default-SR=<sr-uuid>
`}</Terminal>

Run the deploy again: it will work.

### XOA unreachable, or starts then shuts down after a few seconds

XOA runs in HVM mode, which requires hardware virtualization extensions (any hardware since roughly 2011). Check on your host:

<Terminal shell title="host — check virtualization extensions">{`
grep -cE 'vmx|svm' /proc/cpuinfo
`}</Terminal>

A result of `0` means the extensions are absent or disabled: enable virtualization in your BIOS/UEFI settings, or XOA cannot run on this hardware.

## Access issues

### Set or recover the XOA VM password

No password is set for the `xoa` system user by default. Set (or reset) one through the XenStore data of the VM, from your XCP-ng host:

<Terminal shell title="host — set the xoa user password">{`
xe vm-param-set uuid=<UUID> xenstore-data:vm-data/system-account-xoa-password=<password>
`}</Terminal>

Restart the VM, then log in over SSH with the `xoa` user and that password.

### Recover the web login password

From the XOA CLI (see [first console connection](installation.md#first-console-connection)):

<Terminal shell title="xoa — reset a web account password">{`
sudo xo-server-recover-account youremail@here.com
`}</Terminal>

It prompts for a new password. If the email does not exist in XO yet, an admin account is created with it: handy as a rescue account.

### Empty page after login

Your antivirus or firewall is blocking WebSockets, the protocol XO clients use to talk to `xo-server` (see [architecture](architecture.md)). Switch to **HTTPS**: WebSockets are then encapsulated in TLS, out of reach of the interception.

### User login failures

Look at the `xo-server` [logs](#logs) while reproducing the login attempt: the reason is displayed there.

## Logs

- **From the web interface**: Settings, then Logs.
- **From the CLI**, with `journalctl`:

<Terminal shell title="xoa — tail xo-server logs">{`
journalctl -u xo-server -f -n 50
`}</Terminal>

<Terminal shell title="xoa — tail updater logs">{`
journalctl -u xoa-updater -f -n 50
`}</Terminal>

Start the tail, reproduce your issue, and read the error as it happens.

## Runtime issues

### Migration of the XOA VM fails

XOA ships with a static max memory of 16 GiB, which can break its own live migration:

```
"Failed","Migrating VM 'XOA' from '<origin_hostname>' to '<destination_hostname>'
Internal error: Xenops_interface.Internal_error("Domain.Xenguest_failure(\"Error while waiting for suspend notification…\")")
```

Reduce the static max memory of the XOA VM to a lower value and migrate again.

### xo-server out of memory

If `xo-server` crashes with `FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory` in its logs, give it more room, in two steps.

First, increase the memory of the XOA VM itself (4 or 8 GiB).

Then raise the memory limit of the `xo-server` process: edit `/etc/systemd/system/xo-server.service` and find this line:

```ini
ExecStart=/usr/local/bin/xo-server
```

Replace it with the following line, where the number is your VM memory in MiB minus about 512 MiB for the OS (for a 4096 MiB VM, use 3584):

```ini
ExecStart=/usr/local/bin/node --max-old-space-size=3584 /usr/local/bin/xo-server
```

<Terminal shell title="xoa — apply the service change">{`
systemctl daemon-reload
`}</Terminal>

<Terminal shell title="xoa — restart xo-server">{`
systemctl restart xo-server
`}</Terminal>

### Stats not showing on a pool

If statistics are missing for all VMs and hosts of one specific pool, check whether a _Backup network_ is configured on it (pool Advanced tab), and make sure XO can reach **all hosts** of the pool through that network.

### Ghost tasks

If ghost tasks accumulate, try in order:

1. refresh the web page
2. disconnect and reconnect the pool owning the tasks
3. restart the XAPI toolstack of the XCP-ng pool master
4. restart `xo-server`

## Network issues

Check the current configuration with `ip addr` (the default interface is `enX0` or `eth0`), and make sure any external firewall allows the XOA IP. Reconfigure with `xoa network static` or `xoa network dhcp`, as described in [Network configuration](installation.md#network-configuration).

## Updater issues

### Behind a transparent proxy

Transparent proxies usually break the updater with SSL/TLS errors. Allow it to work:

<Terminal shell title="xoa — as root">{`
sudo -s
echo NODE_TLS_REJECT_UNAUTHORIZED=0 >> /etc/xo-appliance/env
npm config -g set strict-ssl=false
systemctl restart xoa-updater
`}</Terminal>

Then run the update again.

### Redownload and rebuild packages

If a package disappeared after a failed build or a manual mistake:

<Terminal shell title="xoa — force the updater to redownload">{`
rm /var/lib/xoa-updater/update.json
xoa-updater --upgrade
`}</Terminal>

## Renew the self-signed certificate

If the provided certificate expired, generate a new one, as root on the appliance:

<Terminal shell title="xoa — regenerate the certificate">{`
cd /etc/ssl
cp cert.pem cert.pem-old
cp key.pem key.pem-old
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -nodes -days 360
systemctl restart xo-server.service
`}</Terminal>

## Reset the configuration

Last resort: reset the `xo-server` database. **This deletes all configured users, servers and backup jobs.**

<Terminal shell title="xoa — full reset">{`
redis-cli
FLUSHALL
systemctl restart xo-server.service
`}</Terminal>

You can then log in again with `admin@admin.net` / `admin`.

## Backup issues

Backups have their own page: [Backup troubleshooting](xo5/backup_troubleshooting.md).

## Still stuck?

Open a ticket from your personal space on [account.vates.tech](https://account.vates.tech): describe the issue, and attach the `xoa check` output and the relevant logs.

### Open a support tunnel {#support-tunnel}

XOA is the only way to get our pro support, which can investigate remotely through a secure SSH tunnel. Our team will ask you for a "support ID": you get it by opening the tunnel, either from the web UI (XOA menu, **Support** section) or from the CLI if the web UI is not reachable:

<Terminal title="open a secure support tunnel">{`
xoa support tunnel
The support tunnel has been created.

Do not stop this command before the intervention is over!
Give this id to the support: 40713
`}</Terminal>

Give this number to the support team: only Vates holds the private key for the tunnel. Close it with `Ctrl+C` once your issue is solved.

:::tip
The tunnel uses the bundled `xoa-support` user. You can deactivate this account with `chage -E 0 xoa-support`, and re-activate it with `chage -E 1 xoa-support`.
:::
