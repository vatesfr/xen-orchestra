# Installation

There is two ways to install Xen Orchestra. If you are just a user and not a developer, please consider using the easier way (XOA).

## Default credentials

Be advised that our default user and password for a fresh install are **admin@admin.net** and **admin**. Do not forget to change it to avoid troubles.

## Xen Orchestra Appliance

The fastest way to install Xen Orchestra is to use our Appliance. You can [download it from here](https://xen-orchestra.com/install-and-update-xo-from-git/). Basically, it's a Debian VM with all the stuff needed to run Xen Orchestra and a update script. No more, no less.

Once you got it, you can import it with `xe vm-import filename=xoa_version_number.xva` or via XenCenter.

After the VM is imported, you just need to start it with a `xe vm-start vm=XOA` or with XenCenter.

XOA is in DHCP by default, so if you need to configure the IP, you need to edit `/etc/network/interfaces` as explain in the [Debian documentation](https://wiki.debian.org/NetworkConfiguration#Configuring_the_interface_manually). You can access the VM console through XenCenter or directly on your Xen hosts the `xe console vm=XOA` command.

Xen Orchestra is now accessible in your browser on ` http://your-vm-ip`!

### XOA credentials

So far, system/SSH user and password are **root**/**root**. Be smart, change the root password as soon as possible!

### Restart and update process in XOA

You can restart XOA by going in XOA on SSH (or console) and type `service xo restart`. If it fails, try it twice.

You can also update XOA with latest version with the integrated update script. This time, a `service xo update` do the job.

## Manual installation

This installation is validated on a fresh Debian 7 (Wheezy) 64 bits. It should be almost the same on others dpkg systems. For RPMs based OS, it should be close, because most of our dependencies came from NPM and not the OS itself.

As you may have seen, XO is composed of two parts: [XO-Server](https://github.com/vatesfr/xo-server/) and [XO-Web](https://github.com/vatesfr/xo-web/). They can be installed separately, even on different machines, but for the sake of simplicity we will set them up together.

## Packages and Pre-requisites

### NodeJS

XO needs Node.js. You can install it:
- by [following this procedure](https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager).
- on Wheezy, the build from source was tested and working well.
- by using *n*, documented just below.

We'll use `n` because it's powerful and flexible. Install it as root:

```bash
/usr/bin/ wget https://raw.githubusercontent.com/visionmedia/n/master/bin/n
chmod +x /usr/bin/n
n stable
```
We'll consider at this point that you've got a working node on your box. E.g:

```
$ node -v
v0.10.25
```

### Packages

```
apt-get install build-essential redis-server libpng-dev ruby git
```

We also need compass in Ruby (we want to [remove this dependency as soon as possible](https://github.com/vatesfr/xo-web/issues/44))

```
gem install compass
```

## Fetching the Code

You may either download them [here](https://github.com/vatesfr/xo-server/archive/master.zip) and [here](https://github.com/vatesfr/xo-web/archive/master.zip) or use `git` with these repositories from `http://github.com/vatesfr/xo-server` and `http://github.com/vatesfr/xo-web`:

```
git clone http://github.com/vatesfr/xo-server
git clone http://github.com/vatesfr/xo-web
```

## Installing dependencies

### XO-Server

Once you have it, you can use `npm` to install the other dependencies: go into XO-Server directory and launch the following command:

```
npm install
```

Then, you have to create a config file for XO-Server:

```
cp config/local.yaml.dist config/local.yaml
```

Edit it to have the right path to deliver XO-Web, because XO-Server embeds an HTTP server (we assume that XO-Server and XO-Web are on the same directory). It's near the end of the file:

```yaml
  mounts:
    '/':
      - '../xo-web/dist/'
```
WARNING: YAML is very strict with indentation: use spaces for it, not tabs.

In this config file, you can also change default ports (80 and 443) for XO-Server.

You can try to start XO-Server to see if it works. You should have something like that:

```
$ ./xo-server
WebServer listening on 0.0.0.0:80
[INFO] Default user: "admin@admin.net" with password "admin"
```

### XO-Web

First, we'll also install dependencies:

```
npm install
```

You can now install `bower` dependencies and build the application:

```
./gulp --production
```

## Running XO

The sole part you have to launch is XO-Server which is quite easy to do, just launch the `xo-server` script, which is in the root of XO-Server's directory':

```
$ ./xo-server
```
That's it! Go on your browser to the XO-Server IP address, and it works :)

## Misc

- You can also consider using [forever](https://github.com/nodejitsu/forever) to have always the process running.

```
npm install -g forever
forever start -c ./node_modules/.bin/coffee src/main.coffee
```

- Our stable branch is "master" and the beta branch is "next-release". You can change it if you want to test our latest features (on both XO-Server and XO-Web, do NOT mix them):

```
git checkout next-release
```
- If you want to update your current version, do this on both repositories:

```
git pull --ff-only
npm install
```

And this in XO-Web:

```
./gulp --production
```

**Congrats! You've reached the end of this doc. See the next part, [about administrate Xen Orchestra](../administration/README.md).**
