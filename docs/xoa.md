# XOA

The fastest way to install Xen Orchestra is to use our Appliance. You can [download it from here](https://xen-orchestra.com/) (fill the form and click on "Try Now"). Basically, it's a Debian VM with:

* Xen Orchestra already installed (nothing to do!)
* Tested with all bundled dependencies (QA)
* The web updater (update in one click)
* Support (+SSH support)
* Secured virtual appliance

## Specifications

By default, this VM is configured with:

* 2 vCPUs
* 2GB of RAM (able to be set in live up to 8GB)
* 15GB of disk (10GB for `/` and 5GB for `/var`)

For usage on huge infrastructure (more than 500+ VMs), feel free to raise the RAM.

## Deployment

Once you've got the XVA file, you can import it with `xe vm-import filename=xoa_unified.xva` or via XenCenter.

After the VM is imported, you just need to start it with a `xe vm-start vm="XOA Unified"` or with XenCenter.

### First console connection

If you connect in SSH or via console, the default credentials are:

* user: xoa
* password: xoa

During your first connection, the system will ask to:

* enter again the current password (`xoa`)
* enter your new password
* retype your new password

When it's done, you'll be disconnected, so reconnect again with your new password.

Here is an example when you connect in SSH for the first time:

```
$ ssh xoa@192.168.100.146
Warning: Permanently added '192.168.100.146' (ECDSA) to the list of known hosts.
xoa@192.168.100.146's password:
You are required to change your password immediately (root enforced)
 __   __             ____           _               _
 \ \ / /            / __ \         | |             | |
  \ V / ___ _ __   | |  | |_ __ ___| |__   ___  ___| |_ _ __ __ _
   > < / _ \ '_ \  | |  | | '__/ __| '_ \ / _ \/ __| __| '__/ _` |
  / . \  __/ | | | | |__| | | | (__| | | |  __/\__ \ |_| | | (_| |
 /_/ \_\___|_| |_|  \____/|_|  \___|_| |_|\___||___/\__|_|  \__,_|

Welcome to XOA Unified Edition, with Pro Support.

* Restart XO: sudo systemctl restart xo-server.service
* Display logs: sudo systemctl status xo-server.service
* Register your XOA: sudo xoa-updater --register
* Update your XOA: sudo xoa-updater --upgrade

OFFICIAL XOA DOCUMENTATION HERE: https://xen-orchestra.com/docs/xoa.html

Support available at https://xen-orchestra.com/#!/member/support

Build number: 16.10.24

Based on Debian GNU/Linux 8 (Stable) 64bits in PVHVM mode

WARNING: Your password has expired.
You must change your password now and login again!
Changing password for xoa.
(current) UNIX password:
Enter new UNIX password:
Retype new UNIX password:
passwd: password updated successfully
Connection to 192.168.100.146 closed.
$
```

### Using sudo

To avoid typing `sudo` for any admin command, you can have a root shell with `sudo -s`:

```
[05:24 27] xoa@xoa:~$ sudo -s

We trust you have received the usual lecture from the local System
Administrator. It usually boils down to these three things:

    #1) Respect the privacy of others.
    #2) Think before you type.
    #3) With great power comes great responsibility.

[sudo] password for xoa:
[05:24 27] xoa:xoa$

```

### Network configuration

XOA is in **DHCP** by default, so if you need to configure the IP, you need to edit `/etc/network/interfaces` as explained in the [Debian documentation](https://wiki.debian.org/NetworkConfiguration#Configuring_the_interface_manually). You can access the VM console through XenCenter or using VNC through a SSH tunnel.

Xen Orchestra is now accessible in your browser on ` https://your-vm-ip`.

> If you are using a static IP configuration, take care of the `/etc/resolv.conf` file to fit your DNS settings.

### SSH Pro Support

By default, if you need support, there is a dedicated user named `xoa-support`. We are the only one with the private key. However, if you want to deactivate it, you can type `chage -E 0 xoa-support`. To re-activate this account, you must use the `chage -E 1 xoa-support`.

### Firewall

By default, XOA is firewalled, with only ports 22, 80 and 443 opened. You can see the current status of the firewall using `sudo ufw status verbose` command:

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

### Downloading XOA with wget

If you want to download your XOA with `wget`, you need to provide your cookie generated on https://xen-orchestra.com. See [this documentation](http://askubuntu.com/questions/161778/how-do-i-use-wget-curl-to-download-from-a-site-i-am-logged-into) for further details.

## Default XO admin account

Default user is **admin@admin.net** with **admin** as a password.

> **SECURITY NOTICE**: create a new admin account and remove this one.

In any case, if you lose your password, you can reset the database and get the default credentials back.

## Timezone

You can verify if your time is correctly set with the `date` command. To set XOA to your current timezone, use `dpkg-reconfigure tzdata`.

## Restart the service

You can restart Xen Orchestra by going in XOA on SSH (or console) and type `systemctl restart xo-server.service`.

To check the status of `xo-server`, use `systemctl status xo-server.service`, it should display something like that:

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
