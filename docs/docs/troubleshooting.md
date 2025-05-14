# Troubleshooting

This page recaps the actions you can perform if you have any problems with your XOA.

:::warning
If you have issues with XO installed from GitHub (not XOA), [please go to the dedicated section first!](community.md).
:::

## Recommendation

If you think you have a problem with your XOA, start by running the `xoa check` command in your terminal:

```console
$ xoa check
✔ Node version
✔ Disk space for /var
✔ Disk space for /
✔ XOA version
✔ xo-server config syntax
✔ Appliance registration
✔ Internet connectivity
```

If the result you have is completely different from that, or if error messages are displayed, lost packets, etc., you have, indeed, a problem. 

The next step should be to check the rest of this page for an existing solution.

:::tip
You can also check the system logs, [as explained here](#cli).
:::

## Backup issues

If you're having issues with your backups, check out the [Backup troubleshooting](backup_troubleshooting) page.

## Didn't find a solution?

Open a ticket for your issue in your [personal space](https://xen-orchestra.com/#!/member/support).

## Deploy error

> Auto deploy failed. - No SR specified and Pool default SR is null

It means you don't have a default SR set on the pool you are importing XOA on. To set a default SR, you must first find the SR UUID you want, with `xe sr-list`. When you have the UUID, you can set the default SR with: `xe pool-param-set uuid=<pool-uuid> default-SR=<sr-uuid>`. For the pool UUID, just press tab after `xe pool-param-set uuid=` and it will autofill your pool UUID. When this is done, re-enter the deploy script command and it will work!

## Unreachable after boot

XOA uses HVM mode. If your physical host doesn't support virtualization extensions, XOA won't work. To check if your XCP-ng/XenServer supports hardware assisted virtualization (HVM), you can enter this command in your host: `grep --color vmx /proc/cpuinfo`. If you don't have any result, it means XOA won't work on this hardware.

## Set or recover XOA VM password

As no password is set for the xoa system user by default, you will need to set your own. This can be done via the XenStore data of the VM. The following is to be ran on your XCP-ng host:

```sh
xe vm-param-set uuid=<UUID> xenstore-data:vm-data/system-account-xoa-password=<password>
```

Where UUID is the uuid of your XOA VM.

Then you need to restart the VM.
You can now login through SSH with the `xoa` username and password you defined in the previous command.

## Recover web login password

If you have lost your password to log in to the XOA webpage, you can reset it. From the XOA CLI (for login/access info for the CLI, [see here](xoa.md#first-console-connection)), use the following command and insert the email/account you wish to recover:

```sh
sudo xo-server-recover-account youremail@here.com
```

It will prompt you to set a new password. If you provide an email here that does not exist in XOA yet, it will create a new account using it, with admin permissions - you can use that new account to log in as well.

## Empty page after login

This happens when your antivirus or firewall is blocking the websocket protocol. This is what we use to communicate between `xo-server` and `xo-web` (see the [architecture page](architecture.md)).

The solution is to use **HTTPS**. When doing so, websockets will be encapsulated in the secured protocol, avoiding interception from your firewall or antivirus system.

## Migration issues

By default, XOA has a static max memory set to 16GiB. Sometimes you can have trouble migrating with this error message:

```
"Failed","Migrating VM 'XOA' from '<origin_hostname>' to '<destination_hostname>'
Internal error: Xenops_interface.Internal_error("Domain.Xenguest_failure(\"Error while waiting for suspend notification: xenguest: xc_domain_save: [1] Save failed (0 = Success)\")")
```

In this case, it means you need to reduce the static max memory field to a lower value, and try again.

## Boot issues

XOA is configured in HVM. It means you need hardware that supports HVM instructions (almost all hardware since 2011). If that's not the case, the symptom is this:

1. XOA VM starts for few seconds
2. Then it shuts down

Please check that you have enabled virtualization settings in your BIOS or upgrade your hardware.

## User login

If you're having trouble logging in, look into the `xo-server` logs.

For more information, refer to the [Logs](#logs) section on this page.

## Logs

This section will explain how to check the XOA logs, and use them to detect issues.

### From the web interface

Go into Settings/Logs view.

### CLI

To filter only what you need, you can use `journalctl`. Below is an example to filter only logs for `xo-server`:

```sh
journalctl -u xo-server -f -n 50
```

This will return the 50 last lines and tail the file. If you have an error message in your application, start this command and try to reproduce the issue. You'll see clearly what the problem is.

You can also filter for the updater program:

```sh
journalctl -u xoa-updater -f -n 50
```

## Configuration

XOA is a virtual appliance running Debian with Xen Orchestra installed. If you have any problems, the first thing to do is to use our check service by running the `xoa check` command in a terminal:

```console
$ xoa check
✔ Node version
✔ Disk space for /var
✔ Disk space for /
✔ XOA version
✔ xo-server config syntax
✔ Appliance registration
✔ Internet connectivity
```

If you have something completely different than that, or error messages, lost packets etc., it means you have a problem.

### Network issues

You can see your current network configuration by running `ifconfig` (default interface is called `enX0` or `eth0`). If you have an external firewall, please check that you allow the XOA's IP.

You can modify the IP configuration with `xoa network static` (for a static IP address) or `xoa network dhcp` to use DHCP.

### Stats not working

If statistics (all VMs and hosts) are not showing for a specific pool, check if there is a _Backup network_ configured on your pool (setting is in the _Advanced_ tab of the pool) and make sure XO can access all hosts of the pool via this network.

### Memory

Sometimes xo-server runs out of memory, this can be seen in the logs (`journalctl -u xo-server.service`):

```
<--- Last few GCs --->
48734864 ms: Mark-sweep 1359.7 (1422.6) -> 1359.7 (1438.6) MB, 1675.5 / 0.0 ms [allocation failure] [scavenge might not succeed].
48736444 ms: Mark-sweep 1359.7 (1438.6) -> 1359.7 (1438.6) MB, 1579.5 / 0.0 ms [allocation failure] [scavenge might not succeed].
48738329 ms: Mark-sweep 1359.7 (1438.6) -> 1368.7 (1422.6) MB, 1885.0 / 0.0 ms [last resort gc].
48740025 ms: Mark-sweep 1368.7 (1422.6) -> 1377.7 (1422.6) MB, 1695.0 / 0.0 ms [last resort gc].
<--- JS stacktrace --->
==== JS stack trace =========================================
Security context: 0x12ba820cfb51 <JS Object>
1: stringify(aka stringify) [native json.js:178] [pc=0x12d240955b57] (this=0x12ba82004381 <undefined>,E=0x162cbe055041 <an Object with map 0x8ecabcc95a1>,F=0x12ba82004381 <undefined>,S=0x12ba82004381 <undefined>)
2: arguments adaptor frame: 1->3
3: response [/usr/local/lib/node_modules/xo-server/node_modules/json-rpc-protocol/dist/format.js:~54] [pc=0x12d240cc1301] (this=0x1de505db7...
FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory
1: node::Abort() [node]
```

In that case, you need to increase the memory allocated to the XOA VM (from 2GB to 4GB or 8GB). Note that simply increasing the RAM for the VM is not enough. You must also edit the service file (`/etc/systemd/system/xo-server.service`) to increase the memory allocated to the xo-server process itself.

:::tip
You should leave ~512MB for the debian OS itself. Meaning if your VM has 4096MB total RAM, you should use `3584` for the memory value below.

```diff
- ExecStart=/usr/local/bin/xo-server
+ ExecStart=/usr/local/bin/node --max-old-space-size=3584 /usr/local/bin/xo-server
```

:::

The last step is to refresh and restart the service:

```sh
systemctl daemon-reload
systemctl restart xo-server
```

### Behind a transparent proxy

If you're behind a transparent proxy, you'll probably have issues with the updater (SSL/TLS issues).

Run the following commands to allow the updater to work:

```sh
sudo -s
echo NODE_TLS_REJECT_UNAUTHORIZED=0 >> /etc/xo-appliance/env
npm config -g set strict-ssl=false
systemctl restart xoa-updater
```

Now try running an update again.

### Updating SSL self-signed certificate

If the provided certificate is expired, you may want to create a new one.

Connect to your appliance via SSH, then as root execute these commands:

```sh
cd /etc/ssl
cp cert.pem cert.pem-old
cp key.pem key.pem-old
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -nodes -days 360
systemctl restart xo-server.service
```

### Ghost tasks

If you have ghost tasks accumulating in your Xen Orchestra you can try the following actions in order:

1. refresh the web page
1. disconnect and reconnect the Xen pool/server owning the tasks
1. restart the XenAPI Toolstack of the XCP-ng/XenServer master
1. restart xo-server

### Redownload and rebuild

If a package disappears due to a build problem or human error, you can redownload them using the updater:

1. `rm /var/lib/xoa-updater/update.json`
2. `xoa-updater --upgrade`

:::tip
We'll have a `xoa-updater --force-reinstall` option soon, to do this automatically
:::

### Reset configuration

If you have problems with your `xo-server` configuration, you can reset the database. **This operation will delete all your configured users and servers, plus any backup jobs**:

1. `redis-cli`
2. `FLUSHALL`
3. `systemctl restart xo-server.service`

You can now log in with `admin@admin.net` and `admin` password.
