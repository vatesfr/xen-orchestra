# Updater

The updater is the central piece to get your XOA on the latest bits of Xen Orchestra.

It allows also to transform your current version in any others (Trial, Starter, Enterprise or Premium) **without downloading a new XOA**.

> By design, the updater is only available in XOA. If you are using the XO from the sources, you'll have to use `git` commands and rebuild to keep up.

## Requirements

In order to work, the updater needs access to `xen-orchestra.com` (port 443).

## Usage

The updater is configurable directly in the web interface, or via the CLI.

### From the web interface

The updater is available in the "Update" menu:

![](./assets/xo5updatemenu.png)

You can see the yellow bell icon: it means your appliance is not registered. You **must register in order to have updates and trial**.

![](./assets/xo5updatetooltip.png)

#### Register

Updates and trial will be available as soon as you registered your appliance. To register, use your https://xen-orchestra.com credentials you gave to download it previously (your email and your password):

![](./assets/xo5register.png)

#### Check for new versions

The updater will check for new versions periodically. A green tick in the menu means your version is up to date:

![](./assets/xo5updatetooltipok.png)

However, if you want to start a manual check, you can do it by clicking on the "Update" button:

![](./assets/xo5updatebutton.png)

#### Upgrade

If a new version is found, you'll have an upgrade button and its tooltip displayed:

![](./assets/xo5updatetooltipneedupdate.png)

#### Proxy configuration

If you are behind a proxy, you can edit your proxy settings in this panel:

![](./assets/xo5proxysettings.png)

### From the CLI

If you interface is not accessible, or you just prefer to use CLIs commands, it's totally possible to do all the operations. You need to access your XOA by SSH (remember the default credentials: root/xoa. Change them ASAP).

#### Register

```
# xoa-updater --register
Successfully connected to xoa-updater-service

Please enter your xen-orchestra.com identifiers to register your XOA:
? Email: myemail@example.net
? Password: *****

ℹ Your Xen Orchestra Appliance has been succesfully registered
```

#### Check for new versions

```
# xoa-updater
Successfully connected to xoa-updater-service
Checking new versions...ok ✔
New versions available:
  xo-server 4.8.1

ℹ xoa-updater may be run again to upgrade packages

```

#### Upgrade

```
# xoa-updater --upgrade
Successfully connected to xoa-updater-service
Checking new versions...ok ✔
New versions available:
  xo-server 4.8.1
[...]
Downloading packages...
Installing new packages...

✔ Your XOA has been successfully updated.

```

## Troubleshooting

If your updater is down, you can restart it with `systemctl restart xoa-updater`.

If you can't fetch updates, perform some checks from your XOA:

* you should be able to successfully `ping xen-orchestra.com`
* if not, check your `/etc/resolv.conf` file and modify it if necessary (give a correct DNS server)
* use `ifconfig` to check your network configuration
* check your firewall(s) and allow XOA to reach xen-orchestra.com (port 443)
