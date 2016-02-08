# Xen Orchestra Server

![](http://i.imgur.com/HVFMrTk.png)

XO-Server is part of [Xen Orchestra](https://github.com/vatesfr/xo), a web interface for XenServer or XAPI enabled hosts.

It contains all the logic of XO and handles:

- connections to all XAPI servers/pools;
- a cache system to provide the best response time possible;
- users authentication and authorizations (work in progress);
- a JSON-RPC based interface for XO clients (i.e. [XO-Web](https://github.com/vatesfr/xo-web)).

[![Build Status](https://travis-ci.org/vatesfr/xo-server.svg?branch=next-release)](https://travis-ci.org/vatesfr/xo-server)
[![Dependency Status](https://david-dm.org/vatesfr/xo-server.svg?theme=shields.io)](https://david-dm.org/vatesfr/xo-server)
[![devDependency Status](https://david-dm.org/vatesfr/xo-server/dev-status.svg?theme=shields.io)](https://david-dm.org/vatesfr/xo-server#info=devDependencies)

___

## Installation

Manual install procedure is [available here](https://github.com/vatesfr/xo/blob/master/doc/installation/README.md#installation).

## Compilation

Production build:

```
$ npm run build
```

Development build:

```
$ npm run dev
```

## How to report a bug?

All bug reports should go into the [bugtracker of xo-web](https://github.com/vatesfr/xo-web/issues).
