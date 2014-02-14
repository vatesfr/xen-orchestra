# Installation

## Introduction

This installation is validated on a fresh Debian 7 (Wheezy) 64 bits. It should be almost the same on others dpkg systems.

As you may have seen, in other parts of the documentation, XO is composed of two parts: [XO-Server](https://github.com/vatesfr/xo-server/) and [XO-Web](https://github.com/vatesfr/xo-web/). They can be installed separately, even on different machines, but for the sake of simplicity we will set them up together.

## Packages and Pre-requisites

### NodeJS

XO needs Node.js. You can install it by [following this procedure](https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager). On Wheezy, the build from source was tested and working well. But if you don't want to do that, you can also get [our Debian package here](http://dev1.vates.fr/node_0.10.25-1_amd64.deb) (node v0.10.25,  built on Wheezy 64 bits: do not use it for another version/distro). This package can be installed like that:


```
dpkg -i node_*
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

Edit it to have the right path to deliver XO-Web, because XO-Server embeds an HTTP server (we assume that xo-server and xo-web are on the same folder). It's near the end of the file:

```
  mounts:
    '/':
      - '../xo-web/dist/'
      - '../xo-web/.tmp/'
      - '../xo-web/app/'
```
WARNING: YAML is very strict with indentation: use spaces for it, not tabs.

In this config file, you can also change default ports (80 and 443) for xo-server.

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

You can now install `bower` dependencies:

```
./bower install
```

And finally, you have to build it with `grunt`:

```
./grunt build
```

## Running XO

The sole part you have to launch is XO-Server which is quite easy to do, just launch the `xo-server` script, which is in the root of xo-server folder:

```
$ ./xo-server
```
That's it! Go on your browser to the XO-Server IP address, and it works :)

## Other stuff

- You can also consider using [forever](https://github.com/nodejitsu/forever) to have always the process running.
- Our stable branch is "master" and the beta branch is "next-release". You can change it if you want to test our latest features (on both XO-Server and XO-Web, do NOT mix them):

```
git branch next-release
```
- If you want to update your current version, do this on both repositories:

```
git pull
npm install
```

XO-Web also need this after each update:

```
./bower install
./grunt build
```