# Xen Orchestra Appliance (XOA)

The fastest way to install Xen Orchestra is to use our Appliance. You can [download it from here](https://xen-orchestra.com/install-and-update-xo-from-git/). Basically, it's a Debian VM with all the stuff needed to run Xen Orchestra. No more, no less.

Once you got it, you can import it with `xe vm-import filename=xoa_version_number.xva` or via XenCenter.

After the VM is imported, you just need to start it with a `xe vm-start vm=XOA` or with XenCenter.

XOA is in **DHCP** by default, so if you need to configure the IP, you need to edit `/etc/network/interfaces` as explain in the [Debian documentation](https://wiki.debian.org/NetworkConfiguration#Configuring_the_interface_manually). You can access the VM console through XenCenter or using VNC through a SSH tunnel.

Xen Orchestra is now accessible in your browser on ` http://your-vm-ip` or in HTTPS on the same URL.

## Default admin account

Default user is **admin@admin.net** with **admin** as a password.

## XOA credentials

So far, system/SSH user and password are **root**/**root**. Be smart, change the root password as soon as possible!

## Restart and update process in XOA

You can restart XOA by going in XOA on SSH (or console) and type `systemctl restart xo-server.service`.

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

You can also update XOA with latest version of `xo-server` and `xo-web`. This time, a `npm update -g xo-web xo-server` do the job.
