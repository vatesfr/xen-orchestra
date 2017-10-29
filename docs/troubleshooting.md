# Troubleshooting

This page recap the possible actions to realize if you have any problems with your XOA.

## XOA deploy error

> Auto deploy failed. - No SR specified and Pool default SR is null

It means you didn't have any default SR set on your pool you are importing XOA. To set a default SR, you must first find the SR UUID you want, with `xe sr-list`. When you got the UUID, you can set the default SR like this: `xe pool-param-set default-SR=<SR_UUID>`. When it's done, re-enter the deploy script command and it will work!

## XOA unreachable after boot

XOA is using HVM mode. If your physical host doesn't support virtualization extensions, XOA won't work. To check if your XenServer support hardware assisted virtualization (HVM), you can enter this command in your host: `grep --color vmx /proc/cpuinfo`. If you don't have any result, it means XOA won't work on this hardware.

## Empty page after login

This is happening when your anti-virus or firewall is blocking websocket protocol. This is what we use to communicate between `xo-server` and `xo-web` (see the [architecture page](architecture.md)).

The solution is to use **HTTPS**. In this way, websockets will be encapsulated in the secured protocol, avoiding interception from your firewalls or anti-virus system.

## XOA migration issues

By default, XOA got a static max memory set to 16GiB. Sometimes, you can have trouble to migrate with this error message:

```
"Failed","Migrating VM 'XOA' from '<origin_hostname>' to '<destination_hostname>'
Internal error: Xenops_interface.Internal_error("Domain.Xenguest_failure(\"Error while waiting for suspend notification: xenguest: xc_domain_save: [1] Save failed (0 = Success)\")")

```

In this case, it means you need to reduce the static max memory field to a lower value, and try again.

## XOA boot issues

XOA is configured in HVM. It means you need a hardware that support HVM instructions (almost all hardware since 2011). If it's not the case, the symptom is this one:

1. XOA VM starts for few seconds
2. Then shutdown itself

Please check that you have enabled virtualization settings in your BIOS or upgrade your hardware.

## XOA configuration

XOA is a virtual appliance running Debian and Xen Orchestra. If you have any problem, the first thing to do is to use our check service by running the `xoa check` command in a terminal:

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

You can see your current network configuration with a `ifconfig eth0`. If you have an external firewall, please check that you allow the XOA's IP.

You can modify the IP configuration with `xoa network static` (for a static IP address) or ` xoa network dhcp` to be in DHCP.

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

In that case you need to do to increase the allocated memory to the
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

Connect to your appliance via SSH as root, and execute these commands:

```
$ cd /etc/ssl
$ cp server.crt server.crt.old
$ cp server.key server.key.old
$ openssl req -x509 -newkey rsa:2048 -keyout server.key -out server.crt -nodes -days 360
$ systemctl restart xo-server.service
```

## XO configuration

The system logs are visible thanks to this command:

```
$ tail -f /var/log/syslog
```

You can read more about logs [in the dedicated chapter](logs.md).

### Ghost tasks

If you have ghost tasks accumulating on your XenOrchestra you can try
the following actions in order:

1. refresh the web page
1. disconnect and reconnect the Xen pool/server of the tasks
1. restart the XenAPI Toolstack of the XenServer master
1. restart xo-server

### Redownload and rebuild all the packages

If a package disappear due to a build problem or a human error, you can redownload them using the updater:

1. `rm /var/lib/xoa-updater/update.json`
2. `xoa-updater --upgrade`

> We'll have a `xoa-updater --force-reinstall` option soon, to do this automatically

### Reset XO configuration

If you have problems with your `xo-server` configuration, you can reset the database. **This operation will delete all your configured users and servers**:

1. `redis-cli`
2. `FLUSHALL`
3. `systemctl restart xo-server.service`

You can now log in with `admin@admin.net` and `admin` password.
