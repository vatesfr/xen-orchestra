# Troubleshooting

This page recaps the actions you can perform if you have any problems with your XOA.

## XOA deploy error

> Auto deploy failed. - No SR specified and Pool default SR is null

It means you don't have a default SR set on the pool you are importing XOA on. To set a default SR, you must first find the SR UUID you want, with `xe sr-list`. When you have the UUID, you can set the default SR with: `xe pool-param-set uuid=<pool-uuid> default-SR=<sr-uuid>`. For the pool UUID, just press tab after `xe pool-param-set uuid=` and it will autofill your pool UUID. When this is done, re-enter the deploy script command and it will work!

## XOA unreachable after boot

XOA uses HVM mode. If your physical host doesn't support virtualization extensions, XOA won't work. To check if your XenServer supports hardware assisted virtualization (HVM), you can enter this command in your host: `grep --color vmx /proc/cpuinfo`. If you don't have any result, it means XOA won't work on this hardware.


## Recover XOA Web-UI login password

If you have lost your password to log in to the XOA webpage, you can reset it. From the XOA CLI (for login/access info for the CLI, [see here](xoa.md#first-console-connection)), use the following command and insert the email/account you wish to recover:  

`xo-server-recover-account youremail@here.com`

It will prompt you to set a new password. If you provide an email here that does not exist in XOA yet, it will create a new account using it, with admin permissions - you can use that new account to log in as well.

## Empty page after login

This happens when your antivirus or firewall is blocking the websocket protocol. This is what we use to communicate between `xo-server` and `xo-web` (see the [architecture page](architecture.md)).

The solution is to use **HTTPS**. When doing so, websockets will be encapsulated in the secured protocol, avoiding interception from your firewall or antivirus system.

## XOA migration issues

By default, XOA has a static max memory set to 16GiB. Sometimes you can have trouble migrating with this error message:

```
"Failed","Migrating VM 'XOA' from '<origin_hostname>' to '<destination_hostname>'
Internal error: Xenops_interface.Internal_error("Domain.Xenguest_failure(\"Error while waiting for suspend notification: xenguest: xc_domain_save: [1] Save failed (0 = Success)\")")

```

In this case, it means you need to reduce the static max memory field to a lower value, and try again.

## XOA boot issues

XOA is configured in HVM. It means you need hardware that supports HVM instructions (almost all hardware since 2011). If that's not the case, the symptom is this:

1. XOA VM starts for few seconds
2. Then it shuts down

Please check that you have enabled virtualization settings in your BIOS or upgrade your hardware.

## XOA configuration

XOA is a virtual appliance running Debian with Xen Orchestra installed. If you have any problems, the first thing to do is to use our check service by running the `xoa check` command in a terminal:

```
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

You can see your current network configuration by running `ifconfig eth0`. If you have an external firewall, please check that you allow the XOA's IP.

You can modify the IP configuration with `xoa network static` (for a static IP address) or ` xoa network dhcp` to use DHCP.

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

In that case, you need to increase the memory allocated to the
XOA VM (from 2GB to 4 or 8 GB), and then update the service file
(`/etc/systemd/system/xo-server.service`) to increase the allocated
memory to xo-server itself:

```diff
- ExecStart=/usr/local/bin/xo-server
+ ExecStart=/usr/local/bin/node --max-old-space-size=8192 /usr/local/bin/xo-server
```

### Behind a transparent proxy

If your are behind a transparent proxy, you'll probably have issues with the updater (SSL/TLS issues).

First, run the following commands:

```
$ echo NODE_TLS_REJECT_UNAUTHORIZED=0 >> /etc/xo-appliance/env
$ npm config -g set strict-ssl=false
```

Then, restart the updater with `systemctl restart xoa-updater`.

### Updating SSL self-signed certificate

If the provided certificate is expired, you may want to create a new one.

Connect to your appliance via SSH, then as root execute these commands:

```
$ cd /etc/ssl
$ cp server.crt server.crt.old
$ cp server.key server.key.old
$ openssl req -x509 -newkey rsa:2048 -keyout server.key -out server.crt -nodes -days 360
$ systemctl restart xo-server.service
```

## XO Configuration

The system logs are visible by using this command:

```
$ tail -f /var/log/syslog
```

You can read more about logs [in the dedicated logs chapter](logs.md).

### Ghost tasks

If you have ghost tasks accumulating in your Xen Orchestra you can try the following actions in order:

1. refresh the web page
1. disconnect and reconnect the Xen pool/server owning the tasks
1. restart the XenAPI Toolstack of the XenServer master
1. restart xo-server

### Redownload and rebuild all the packages

If a package disappears due to a build problem or human error, you can redownload them using the updater:

1. `rm /var/lib/xoa-updater/update.json`
2. `xoa-updater --upgrade`

> We'll have a `xoa-updater --force-reinstall` option soon, to do this automatically

### Reset XO configuration

If you have problems with your `xo-server` configuration, you can reset the database. **This operation will delete all your configured users and servers, plus any backup jobs**:

1. `redis-cli`
2. `FLUSHALL`
3. `systemctl restart xo-server.service`

You can now log in with `admin@admin.net` and `admin` password.
