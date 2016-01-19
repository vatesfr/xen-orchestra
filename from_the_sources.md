# From the sources

**WARNING**: we don't make support for this manual installation. We cannot guarantee anything if used in production. Use it at your own risks.

**WARNING 2**: **It's impossible to predict the result of a build for any Node and NPM versions**. Please consider to use XOA before trying to play with the manual build, which can be difficult if you are not used to NodeJS and NPM.

> Please take time to read it carefully.

This installation is validated against a fresh Debian 8 (Jessie) 64 bits. It should be almost the same on others dpkg systems. For RPMs based OS, it should be close, because most of our dependencies came from NPM and not the OS itself.

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
n lts
```
We'll consider at this point that you've got a working node on your box. E.g:

```
$ node -v
v4.2.4
```

Be sure to have a recent version of `npm` by using `npm i -g npm` (>=2.7):

```
$ npm -v
3.5.3
```

### Packages

XO needs those packages to be built and installed. Redis is used as a database by XO.

```
apt-get install build-essential redis-server libpng-dev git python-minimal
```

## Fetching the Code

You may either download them [here](https://github.com/vatesfr/xo-server/archive/stable.zip) and [here](https://github.com/vatesfr/xo-web/archive/stable.zip) or use `git` with these repositories from `http://github.com/vatesfr/xo-server` and `http://github.com/vatesfr/xo-web`:

```
git clone -b stable http://github.com/vatesfr/xo-server
git clone -b stable http://github.com/vatesfr/xo-web
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

The sole part you have to launch is XO-Server which is quite easy to do, just launch the `xo-server` script, which is in the root of XO-Server's directory:

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

- Our stable branch is *stable* and the beta branch is *next-release*. You can change it if you want to test our latest features (on both XO-Server and XO-Web, do NOT mix them):

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

Same principle for `xo-server`:

1. `rm -rf node_modules`
1. `npm install`

## FreeBSD

If you are using FreeBSD, you need to install these packages:

```
pkg install gmake redis python git npm node autoconf
```

You can update `npm` itself right now with a `npm update -g`


Because FreeBSD is shipped with CLANG and not GCC, you need to do this:

```
ln -s /usr/bin/clang++ /usr/local/bin/g++
```

To enable redis on boot, add this in your `/etc/rc.conf`:

```
redis_enable="YES"
```

Don't forget to start redis if you don't reboot now:

```
service redis start
```

## External dependencies

In order to have Continuous Delta Backup working, you need to have the `vhd-util` binary inside your `xo-server/bin` folder.

You can find the sources here: https://github.com/rubiojr/vhd-util-convert