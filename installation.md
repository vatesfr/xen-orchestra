# Installation

There are two ways to install Xen Orchestra. If you are just a user and not a developer, please consider using the pre-built applance, as this is the easier way (XOA).

Be advised that our default user and password for a fresh install are **admin@admin.net** and **admin**. Remember to change the default password immediately after installation.

## XOA

The fastest way to install Xen Orchestra is to use our Appliance. You can [download it from here](https://xen-orchestra.com/) (fill the form and click on "Try Now"). Basically, it's a Debian VM with all the stuff needed to run Xen Orchestra, no more, no less.

Once you've got it, you can import it with `xe vm-import filename=xoa_version_number.xva` or via XenCenter.

After the VM is imported, you just need to start it with a `xe vm-start vm=XOA` or with XenCenter.

XOA is in **DHCP** by default, so if you need to configure the IP, you need to edit `/etc/network/interfaces` as explained in the [Debian documentation](https://wiki.debian.org/NetworkConfiguration#Configuring_the_interface_manually). You can access the VM console through XenCenter or using VNC through a SSH tunnel.

Xen Orchestra is now accessible in your browser on ` http://your-vm-ip` or in HTTPS on the same URL.

## Default admin account

Default user is **admin@admin.net** with **admin** as a password.

## XOA credentials

By default, system/SSH user and password are **root**/**xoa**. Be smart and change the root password as soon as possible!

## Restart XOA

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

## From the sources

This installation is validated against a fresh Debian 7 (Wheezy) 64 bits. It should be almost the same on others dpkg systems. For RPMs based OS, it should be close, because most of our dependencies came from NPM and not the OS itself.

FreeBSD user? Check [our dedicated page](./installation_freebsd.md) for this.

As you may have seen, in other parts of the documentation, XO is composed of two parts: [XO-Server](https://github.com/vatesfr/xo-server/) and [XO-Web](https://github.com/vatesfr/xo-web/). They can be installed separately, even on different machines, but for the sake of simplicity we will set them up together.

## Packages and Pre-requisites

### NodeJS

XO needs Node.js. You can install it:
- by [following this procedure](https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager).
- on Wheezy, the build from source was tested and working well.
- by using *n*, documented just below.

We'll use `n` because it's powerful and flexible. First, you need `curl`. Then, install it as root:

```bash
curl -o /usr/local/bin/n https://raw.githubusercontent.com/visionmedia/n/master/bin/n
chmod +x /usr/local/bin/n
n stable
```
We'll consider at this point that you've got a working node on your box. E.g:

```
$ node -v
v4.1.1
```

Be sure to have a recent version of `npm` (>=2.7):

```
$ npm -v
3.3.12
```

### Packages

```
apt-get install build-essential redis-server libpng-dev git python-minimal
```

## Fetching the Code

You may either download them [here](https://github.com/vatesfr/xo-server/archive/master.zip) and [here](https://github.com/vatesfr/xo-web/archive/master.zip) or use `git` with these repositories from `http://github.com/vatesfr/xo-server` and `http://github.com/vatesfr/xo-web`:

```
git clone http://github.com/vatesfr/xo-server
git clone http://github.com/vatesfr/xo-web
```

## Installing dependencies

### XO-Server

Once you have it, use `npm`, as the non-root user owning the fetched code, to install the other dependencies: go into XO-Server directory and launch the following command:

```
npm install && npm run build
```

Then, you have to create a config file for XO-Server:

```
cp sample.config.yaml .xo-server.yaml
```

Edit and uncomment it to have the right path to deliver XO-Web, because XO-Server embeds an HTTP server (we assume that XO-Server and XO-Web are on the same directory). It's near the end of the file:

```yaml
  mounts: '/': '../xo-web/dist/'
```
> Note this `dist` folder will be created in the next step (see the XO-Web section)

WARNING: YAML is very strict with indentation: use spaces for it, not tabs.

In this config file, you can also change default ports (80 and 443) for XO-Server.

You can try to start XO-Server to see if it works. You should have something like that:

```
$ npm start
WebServer listening on localhost:80
[INFO] Default user: "admin@admin.net" with password "admin"
```

### XO-Web

First, we'll also install dependencies:

```
$ npm install
```

You can now install `bower` dependencies and build the application:

```
$ npm run build
```

## Running XO

The sole part you have to launch is XO-Server which is quite easy to do, just launch the `xo-server` script, which is in the root of XO-Server's directory':

```
$ npm start
```
That's it! Go on your browser to the XO-Server IP address, and it works! :)

## Misc

- You can also consider using [forever](https://github.com/nodejitsu/forever) to have always the process running.

```
$ npm install -g forever
$ forever start bin/xo-server
```

- Our stable branch is "master" and the beta branch is "next-release". You can change it if you want to test our latest features (on both XO-Server and XO-Web, do NOT mix them):

```
$ git checkout next-release
```
- If you want to update your current version, do this on both repositories:

```
$ git pull --ff-only
$ npm install
$ npm run build
```

## Troubleshooting

If you have problem during the buiding phase in `xo-web`, follow these steps:

1. `rm -rf node_modules`
1. `git checkout node_modules`
1. `npm install`
1. `npm run build`
