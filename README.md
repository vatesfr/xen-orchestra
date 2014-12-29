# Xen Orchestra Server

XO-Server is part of [Xen Orchestra](https://github.com/vatesfr/xo), a web interface for XenServer or XAPI enabled hosts.

It contains all the logic of XO and handles:

- connections to all XAPI servers/pools;
- a cache system to provide the best response time possible;
- users authentication and authorizations (work in progress);
- a JSON-RPC based interface for XO clients (i.e. [XO-Web](https://github.com/vatesfr/xo-web)).

[![Dependency Status](https://david-dm.org/vatesfr/xo-server.svg?theme=shields.io)](https://david-dm.org/vatesfr/xo-server)
[![devDependency Status](https://david-dm.org/vatesfr/xo-server/dev-status.svg?theme=shields.io)](https://david-dm.org/vatesfr/xo-server#info=devDependencies)

___

## Installation

Manual install procedure is [available here](https://github.com/vatesfr/xo/blob/master/doc/installation/README.md#installation)

## How to report a bug?

If you are certain the bug is exclusively related to XO-Server, you may use the [bugtracker of this repository](https://github.com/vatesfr/xo-server/issues).

Otherwise, please consider using the [bugtracker of the general repository](https://github.com/vatesfr/xo/issues).
