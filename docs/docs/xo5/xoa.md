# The XO Appliance (XOA)

Everything about the appliance itself: what is inside the VM, its default configuration, and the support tooling. For deploying and configuring a new XOA, see [Installation](../installation.md).

:::tip
As a XOA user, you can open tickets from your personal space: [account.vates.tech](https://account.vates.tech).
:::

## Technical Support

XOA is the only way to get our pro support, which is available remotely via SSH and a special tunnel.

### XOA Check

XOA check is a way to test if you XOA is correctly configured. It should be the first thing to do if you have any problem!

To run this check, in the web UI, you can access the support section in the XOA menu. In this section you can launch an `xoa check` command:

![](https://xen-orchestra.com/blog/content/images/2019/10/xoacheck.png)

### Support tunnel

Open a secure support tunnel so our team can remotely investigate on your XOA. For that, we need to get the "support ID". See below:

![](https://user-images.githubusercontent.com/10992860/67384755-10f47f80-f592-11e9-974d-bbdefd0bf353.gif)

<a id="ssh-pro-support"></a>

If your web UI is not working, you can also open the secure support tunnel from the CLI. To open a private tunnel (we are the only one with the private key), you can use the command `xoa support tunnel` like below:

```console
$ xoa support tunnel
The support tunnel has been created.

Do not stop this command before the intervention is over!
Give this id to the support: 40713
```

Give us this number, and we'll be able to access your XOA in a secure manner. Then, close the tunnel with `Ctrl+C` after your issue has been solved by support.

:::tip
The user `xoa-support` is used by the tunnel. If you want to deactivate this bundled user, you can run `chage -E 0 xoa-support`. To re-activate this account, you must run `chage -E 1 xoa-support`.
:::

## XOA VM Specifications

By default, the VM is configured with:

- 2 vCPUs
- 2GiB of RAM
- 20GiB of free SR space (2GiB on thin pro SR)

For use on huge infrastructure (more than 500+ VMs), feel free to increase the RAM.

## Firewall

By default XOA is firewalled, with only ports 22, 80 and 443 opened. You can see the current status of the firewall using the `sudo ufw status verbose` command:

```
Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing)
New profiles: skip

To                         Action      From
--                         ------      ----
22                         ALLOW IN    Anywhere
80                         ALLOW IN    Anywhere
443                        ALLOW IN    Anywhere
22/tcp                     LIMIT IN    Anywhere
22                         ALLOW IN    Anywhere (v6)
80                         ALLOW IN    Anywhere (v6)
443                        ALLOW IN    Anywhere (v6)
22/tcp                     LIMIT IN    Anywhere (v6)
```

If you want to open or close ports, please check the [documentation of UFW](https://help.ubuntu.com/community/UFW).

## Default XO account

Default user is **admin@admin.net** with **admin** as a password.

:::warning
If you are using the default credentials, **please** create a new admin account and remove this one.
:::

In any case, if you lose your password, you can reset the database and get the default credentials back.

## Timezone

You can verify that your time is correctly set with the `date` command. To set XOA to your current timezone, use `sudo dpkg-reconfigure tzdata`.

## Setting a custom NTP server

By default, XOA is configured to use the `systemd-timesyncd` daemon, along with the standard Debian NTP servers:

```
pool 0.debian.pool.ntp.org iburst
pool 1.debian.pool.ntp.org iburst
pool 2.debian.pool.ntp.org iburst
pool 3.debian.pool.ntp.org iburst
```

If you'd like to use another pool, you can make the changes directly in `/etc/systemd/timesyncd.conf`.

You will need to be root to edit this file (or use `sudo`). We recommend adding your custom server to the top of the list, leaving the Debian server entries if possible.

If you'd like to simply change NTP servers, use the `xoa network ntp` command:

```console
$ xoa network ntp
? NTP servers (space separated)
```

For changes to take effect, you will need to restart NTP: `systemctl restart systemd-timesyncd.service`.

## Restart the service

You can restart Xen Orchestra by accessing XOA via SSH (or console) and running `systemctl restart xo-server.service`.

To check the status of `xo-server`, use `systemctl status xo-server.service`, it should display something like this:

```
xo-server.service - XO Server
   Loaded: loaded (/etc/systemd/system/xo-server.service; enabled)
   Active: active (running) since Thu 2014-08-14 10:59:46 BST; 21min ago
 Main PID: 394 (node)
   CGroup: /system.slice/xo-server.service
           └─394 node /usr/local/bin/xo-server

Aug 14 10:59:46 xoa systemd[1]: Starting XO Server...
Aug 14 10:59:46 xoa systemd[1]: Started XO Server.
Aug 14 10:59:48 xoa xo-server[394]: WebServer listening on http://0.0.0.0:80
```

## Migrate from an older XOA

If you still use the first XOA (which was not the "unified" version), you can easily migrate all your settings (ACLs, users, servers, etc) to the new version painlessly.

To do so, go into "Settings/Config" of your old XOA. Export the configuration: you'll download a `config.json` file.

![](../assets/xo5_export.png)

Now go to your new unified XOA, "Settings/Config" and import the `config.json` file you downloaded previously, by doing a drag and drop:

![](../assets/xo5_import.png)

That's it!
