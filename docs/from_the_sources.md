# From the sources

**WARNING**: we don't make support for this manual installation. We cannot guarantee anything if used in production. Use it at your own risks.

**WARNING 2**: **It's impossible to predict the result of a build for any Node and NPM versions**. Please consider to use XOA before trying to play with the manual build, which can be difficult if you are not used to NodeJS and NPM.

> Please take time to read it carefully.

This installation is validated against a fresh Debian 8 (Jessie) 64 bits. It should be almost the same on others dpkg systems. For RPMs based OS, it should be close, because most of our dependencies came from NPM and not the OS itself.

As you may have seen, in other parts of the documentation, XO is composed of two parts: [xo-server](https://github.com/vatesfr/xo-server/) and [xo-web](https://github.com/vatesfr/xo-web/). They can be installed separately, even on different machines, but for the sake of simplicity we will set them up together.

## Packages and Pre-requisites

### NodeJS

XO needs Node.js. **Please always use the LTS version of Node**.

We'll consider at this point that you've got a working node on your box. E.g:

```
$ node -v
v8.9.1
```

See [this page](https://nodejs.org/en/download/package-manager/) for instructions on how to install Node.

### Yarn

> Yarn is a package manager which offers more guarantees than npm.

See [this page](https://yarnpkg.com/en/docs/install#linux-tab) for instructions on how to install Yarn.

### Packages

XO needs those packages to be built and installed. Redis is used as a database by XO.

Eg on Debian:

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

### xo-server

Once you have it, use `yarn`, as the non-root user owning the fetched code, to install the other dependencies. Into `xo-server` directory and launch the following command:

```
$ yarn
$ yarn build
```

Then, you have to create a config file for `xo-server`:

```
cp sample.config.yaml .xo-server.yaml
```

Edit and uncomment it to have the right path to deliver `xo-web`, because `xo-server` embeds an HTTP server (we assume that `xo-server` and `xo-web` are on the same directory). It's near the end of the file:

```yaml
  mounts: '/': '../xo-web/dist/'
```
> Note this `dist` folder will be created in the next step (see the `xo-web` section)

**WARNING: YAML is very strict with indentation: use spaces for it, not tabs**.

In this config file, you can also change default ports (80 and 443) for xo-server. If you are running the server as a non-root user, you will need to set the port to 1024 or higher.

You can try to start xo-server to see if it works. You should have something like this:

```
$ yarn start
WebServer listening on localhost:80
[INFO] Default user: "admin@admin.net" with password "admin"
```

### xo-web

First, we'll also install dependencies:

```
$ yarn
$ yarn build
```
## Running XO

The sole part you have to launch is xo-server which is quite easy to do, just launch the `xo-server` script, which is in the root of xo-server's directory:

```
$ yarn start
```
That's it! Go on your browser to the xo-server IP address, and it works! :)

## Misc

- You can use [forever](https://github.com/nodejitsu/forever) to have the process always running:

```
$ yarn global add forever
$ forever start bin/xo-server
```

- Or you can use  [forever-service](https://github.com/zapty/forever-service) to install XO as a service, so it starts automatically at boot. As root:

```
yarn global add forever
yarn global add forever-service
cd /home/username/xo-server/bin/
forever-service install orchestra -r username -s xo-server
```

Be sure to change the usernames to the user you are running xo-server as. The forever-service command must be run in the xo-server bin directory. Now you can manage the service, and it will start on boot with the machine:

```
service orchestra start
service orchestra status
```

If you need to delete the service:

```
forever-service delete orchestra
```

- Our stable branch is *stable* and the beta branch is *next-release*. You can change it if you want to test our latest features (on both xo-server and `xo-web`, do NOT mix them):

```
$ git checkout next-release
```
- If you want to update your current version, do this on both repositories:

```
$ git pull --ff-only
$ yarn
$ yarn build
```

## Troubleshooting

If you have problem during the buiding phase in `xo-web` or `xo-server`, follow these steps:

1. `rm -rf node_modules`
1. `yarn`
1. `yarn build`

## FreeBSD

If you are using FreeBSD, you need to install these packages:

```
pkg install gmake redis python git npm node autoconf
```

You can update `npm` itself right now with a `npm update -g`

A few of the npm packages look for system binaries as part of their installation, and if missing will try to build it themselves. Installing these will save some time and allow for easier upgrades later:

```
pkg install jpeg-turbo optipng gifsicle
```

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
