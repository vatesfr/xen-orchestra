# XO Doc

## Introduction

Welcome on the Xen Orchestra documentation. This document has multiple purposes, it explains:
- what is Xen Orchestra
- how to install it
- how to use it

## Architecture

This part is dedicated to the architecture of Xen Orchestra. It will give you hints about how we build this software.

### Overview

Here is a diagram giving an overview of what is Xen Orchestra:
![](./assets/xo-arch.jpg)

Xen Orchestra is split in modules:
- the core is "[xo-server](https://github.com/vatesfr/xo-server)", a daemon dealing directly with XenServer or XAPI capable hosts. This is where are stored users, and it's the center point for talking to your whole Xen infrastructure.
- the Web interface is in "[xo-web](https://github.com/vatesfr/xo-web)": you are running it directly in your browser. The connection with "xo-server" is done via *WebSockets*
- "[xo-cli](https://github.com/vatesfr/xo-cli)" is a new module allowing to send order directly in command line

We will use this modular architecture to add further parts later. It's completely flexible, allowing us to adapt Xen Orchestra in every existing work-flow.

### XO-server

XO-Server is the core of Xen Orchestra. It's central role opens a lot of possibilities versus other solutions. Let's see why.

#### Daemon mode

As a daemon, XO-server is always up. In this way, it can listen and record every events occurring on your whole Xen infrastructure. Connections are always open and it can cache informations before serve it to another client (CLI, Web or anything else).

#### Central point

Contrary to XenCenter, each Xen Orchestra's client is connected to one XO-Server, and not all the Xen servers. With a traditional architecture:

![](./assets/without-xo.jpg)

You can see how we avoid a lost of resources and bandwidth waste with a central point:

![](./assets/with-xo.jpg)

#### Pluggable

It's really easy to plug other modules to XO-server, thus extend or adapt the solution to your needs (see XO-web and XO-cli for real examples).

#### NodeJS under the hood

[NodeJS](https://en.wikipedia.org/wiki/Nodejs) is a software platform for scalable server-side and networking applications. It's famous for its efficiency, scalability and its asynchronous capabilities. Exactly what we need! Thus, XO-server is written in JavaScript. 

### XO-web

This is probably the first thing you'll see of Xen Orchestra. It's the Web interface, allowing to interact with your virtual infrastructure. As a module for XO-web, it facilitates the everyday Xen administrator work, but also provide a solution to delegate some part of your infrastructure to other people.

#### JavaScript

We are also using JavaScript for XO-web: we stay consistent from the back-end to the front-end with one main language. [AngularJS](https://en.wikipedia.org/wiki/Angularjs) and [Twitter Bootstrap](https://en.wikipedia.org/wiki/Bootstrap_%28front-end_framework%29) are also powerful allies to our everyday development.

### XO-cli

After [a request from someone on our Github repositoryy](https://github.com/vatesfr/xo-server/issues/23), we decided to add the possibility to do some actions with CLI. Just few hours after the request, [we created XO-cli](https://github.com/vatesfr/xo-cli). It's a real example of the Xen Orchestra modularity, and how we can be flexible.

### Other modules

In our vision, we think Xen Orchestra can be more than "just an Web GUI for Xen". With modularity, we can imagine a lot of things: because XO-server is a daemon, it can record any activity and thus create performance reports. The next step is auto-migrate VM for adapting the need to the demand (reducing the costs to only what you need). Everything is possible!

## Installation

There is two ways to install Xen Orchestra. If you are just a user and not a developer, please consider using the easier way (XOA).

### Default credentials

Be advised that our default user and password for a fresh install are **admin@admin.net** and **admin**. Do not forget to change it to avoid troubles.

### Xen Orchestra Appliance

The fastest way to install Xen Orchestra is to use our Appliance. You can [download it from here](https://xen-orchestra.com/install-and-update-xo-from-git/). Basically, it's a Debian VM with all the stuff needed to run Xen Orchestra and a update script. No more, no less.

Once you got it, you can import it with `xe vm-import filename=xoa_version_number.xva` or via XenCenter.

After the VM is imported, you just need to start it with a `xe vm-start vm=XOA` or with XenCenter.

XOA is in DHCP by default, so if you need to configure the IP, you need to edit `/etc/network/interfaces` as explain in the [Debian documentation](https://wiki.debian.org/NetworkConfiguration#Configuring_the_interface_manually). You can access the VM console through XenCenter or directly on your Xen hosts the `xe console vm=XOA` command.

Xen Orchestra is now accessible in your browser on ` http://your-vm-ip`!

#### XOA credentials

So far, system/SSH user and password are **root**/**root**. Be smart, change the root password as soon as possible!

#### Restart and update process in XOA

You can restart XOA by going in XOA on SSH (or console) and type `service xo restart`. If it fails, try it twice.

You can also update XOA with latest version with the integrated update script. This time, a `service xo update` do the job.

### Manual installation

This installation is validated on a fresh Debian 7 (Wheezy) 64 bits. It should be almost the same on others dpkg systems. For RPMs based OS, it should be close, because most of our dependencies came from NPM and not the OS itself.

As you may have seen, XO is composed of two parts: [XO-Server](https://github.com/vatesfr/xo-server/) and [XO-Web](https://github.com/vatesfr/xo-web/). They can be installed separately, even on different machines, but for the sake of simplicity we will set them up together.

### Packages and Pre-requisites

#### NodeJS

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

#### Packages

```
apt-get install build-essential redis-server libpng-dev ruby git
```

We also need compass in Ruby (we want to [remove this dependency as soon as possible](https://github.com/vatesfr/xo-web/issues/44))

```
gem install compass
```

### Fetching the Code

You may either download them [here](https://github.com/vatesfr/xo-server/archive/master.zip) and [here](https://github.com/vatesfr/xo-web/archive/master.zip) or use `git` with these repositories from `http://github.com/vatesfr/xo-server` and `http://github.com/vatesfr/xo-web`:

```
git clone http://github.com/vatesfr/xo-server
git clone http://github.com/vatesfr/xo-web
```

### Installing dependencies

#### XO-Server

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

#### XO-Web

First, we'll also install dependencies:

```
npm install
```

You can now install `bower` dependencies and build the application:

```
./gulp --production
```

### Running XO

The sole part you have to launch is XO-Server which is quite easy to do, just launch the `xo-server` script, which is in the root of XO-Server's directory':

```
$ ./xo-server
```
That's it! Go on your browser to the XO-Server IP address, and it works :)

### Misc

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

## Administration

Once Xen Orchestra is installed, you can configure some parameters in the configuration file. Let's see how to do that.

### Configuration

The configuration file is in XO-server folder (for XOA users, it's in `/root/xo-server/config/local.yaml.dist`). If it's not already done, copy this file to `local.yaml` in the same folder. Now, you can edit the configuration safely (if you destroy it, you can reuse the dist file).

WARNING: YAML is very strict with indentation: use spaces for it, not tabs.

#### User to run XO-server as

By default, XO-server is running with 'nobody' user and 'nogroup' group. You can change it by uncommenting these lines and choose whatever user/group you want:

```yaml
user: 'nobody'
group: 'nogroup'
```

#### HTTP listen address and port

By default, XO-server listens to all addresses (0.0.0.0) and runs on port 80. You can change this if you want in the `# Basic HTTP` section:

```yaml
host: '0.0.0.0'
port: 80
```

#### HTTPS

XO-server can also run in HTTPS (both HTTP and HTTPS can cohabit), just modify what's needed in the `# Basic HTTPS` section, this time with certificates/keys you want and their path:

```yaml
host: '0.0.0.0'
port: 443
certificate: './certificate.pem'
key: './key.pem'
```

#### Link to XO-web

On XOA, you shouldn't have to change this. On manual install, you need to link files served by XO-server for XO-web. That's the mount section. In this example, "xo-web" folder is in the same folder than "xo-server":

```yaml
  mounts:
    '/':
      - '../xo-web/dist/'
```

#### Redis server

By default, XO-server will try to contact Redis server on `localhost`, with the port `6379`. But you can define anything else you want:

```yaml
  uri: 'tcp://db:password@hostname:port'
```

#### Log file

On XOA, the log file for XO-server is in `/var/log/xo`: it has all of the server informations. Can be a real help when you have trouble.

### First connection

#### Login screen

This is the login screen:

![](./assets/loginok.png)

Note the green *check* icons: it indicates that you are correctly connected to XO-server. If you see this icon: ![](./assets/loginbad.png), that's not good. Please check the Troubleshooting section if it's the case.

The default user login/password is `admin@admin.net` with `admin` password. This is what you should see after been logged:

![](./assets/welcome.png)

 You should change it just after you are logged.

### Users and passwords

### Add Xen hosts

## Layout

### Navigation bar

### Main view

### Flat view

## Usage

### Virtual machines

#### Life-cycle (stop, start, reboot)

#### Live migration

#### Console

#### Edit VM characteristics

#### Create a VM

#### Copy a VM

#### Create a template

#### Delete

#### Snapshots management

#### Disk management

#### Network (interface) management

#### Logs

#### Group actions

### Hosts

#### Life-cycle

#### Memory Map

#### Edit host characteristics

#### Restart tool-stack

#### Remove from pool

#### Host console

#### Attached storage repository

#### Network (interface) management

#### Pending tasks

#### Logs

### Storage repositories

#### Edit SR characteristics

#### VDI Map

#### Virtual disks management

##### Rescan the repository

#### Connected hosts

#### Logs

### Pools

#### Edit pool characteristics

#### Hosts list

#### Shared SR list

#### Logs

## Troubleshooting

## How to contribute

### Report bugs

### Fork us!
