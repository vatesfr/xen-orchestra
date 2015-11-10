# Architecture

Xen Orchestra is a software built with a server and a client part. In fact, there is many clients, such as the web client, `xo-web`, but also a CLI capable client, called `xo-cli`.

## Overview

### XOA

*Xen Orchestra virtual Appliance* (XOA) is a virtual machine with Xen Orchestra already installed, thus working out-of-the-box.

This is the easiest way to try Xen Orchestra in a minute.

Your XOA is connected to all your hosts, or on the pool master only if you are using Pools in XenServer:

![](https://xen-orchestra.com/assets/partner2.jpg)

### Xen Orchestra (XO)

![](https://github.com/vatesfr/xo/raw/master/doc/architecture/assets/xo-arch.jpg)

Xen Orchestra itself is built as a modular solution. Each part has its role:
- the core is "[xo-server](https://github.com/vatesfr/xo-server)", a daemon dealing directly with XenServer or XAPI capable hosts. This is where users are stored, and it's the center point for talking to your whole Xen infrastructure.
- the Web interface is in "[xo-web](https://github.com/vatesfr/xo-web)": you are running it directly in your browser. The connection with "xo-server" is done via *WebSockets*.
- "[xo-cli](https://github.com/vatesfr/xo-cli)" is a module allowing to send commands directly from the command line.

We already have other modules around it (like the LDAP plugin for example). It allows to use this modular architecture to add further parts later. It's completely flexible, allowing us to adapt Xen Orchestra in every existing work-flow.



## XO-web

This is probably the first thing you'll see of Xen Orchestra. It's the Web interface, allowing to interact with your virtual infrastructure. As a module for XO-web, it facilitates the everyday Xen administrator work, but also provide a solution to delegate some part of your infrastructure to other people.

### JavaScript

We are also using JavaScript for XO-web: we stay consistent from the back-end to the front-end with one main language. [AngularJS](https://en.wikipedia.org/wiki/Angularjs) and [Twitter Bootstrap](https://en.wikipedia.org/wiki/Bootstrap_%28front-end_framework%29) are also powerful allies to our everyday development.

## XO-cli

After [a request from someone on our Github repositoryy](https://github.com/vatesfr/xo-server/issues/23), we decided to add the possibility to do some actions with CLI. Just few hours after the request, [we created XO-cli](https://github.com/vatesfr/xo-cli). It's a real example of the Xen Orchestra modularity, and how we can be flexible.

## Other modules

We already have other modules working, e.g for authentication, like a LDAP, SAML or GitHub external providers.
