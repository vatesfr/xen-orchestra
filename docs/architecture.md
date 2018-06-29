
# Architecture

Xen Orchestra (XO) is software built with a server and clients, such as the web client `xo-web`, but also a CLI capable client, called `xo-cli`.

> XO is totally agent-less: you don't have to install any program on your hosts to get it working!

## XOA

*Xen Orchestra Virtual Appliance* (XOA) is a virtual machine with Xen Orchestra already installed, thus working out-of-the-box.

This is the easiest way to try Xen Orchestra quickly.

Your XOA is connected to all your hosts, or the pool master only if you are using Pools in XenServer:

![](./assets/partner2.jpg)

## Xen Orchestra (XO)

![](./assets/xo-arch.jpg)

Xen Orchestra itself is built as a modular solution. Each part has its role:
- The core is "[xo-server](https://github.com/vatesfr/xen-orchestra/tree/master/packages/xo-server/)" - a daemon dealing directly with XenServer or XAPI capable hosts. This is where users are stored, and it's the center point for talking to your whole Xen infrastructure.
- The web interface is "[xo-web](https://github.com/vatesfr/xen-orchestra/tree/master/packages/xo-web)" - it runs directly from your browser. The connection with ```xo-server``` is done via *WebSockets*.
- "[xo-cli](https://github.com/vatesfr/xen-orchestra/tree/master/packages/xo-cli)" is a module allowing you to send commands directly from the command line.


We have other modules as well (like the LDAP plugin for example). It allows us to use this modular architecture to add further parts as we need them. It's completely flexible, allowing us to adapt Xen Orchestra to every existing workflow.
