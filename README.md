# Xen Orchestra Server

**This is a test implementation using node.js.**

XO-Server is part of [Xen Orchestra](https://github.com/vatesfr/xo), a web interface for [XCP](https://en.wikipedia.org/wiki/Xen_Cloud_Platform).

It contains all the logic of XO and handles:

- connections to all XCP servers/pools;
- a cache system to provide the best response time possible;
- users authentication and authorizations;
- a JSON-RPC based interface for XO clients (i.e. [XO-Web](https://github.com/vatesfr/xo-web)).

__XO is currently under development and may be subject to important bugs.__

## Installation

_There is currently no package available for XO-Server, you must therefore use the following procedure._

1. Download the code, you may either use git `git clone git://github.com/vatesfr/xo-server` or download a [Zip archive](https://github.com/vatesfr/xo-server/archive/master.zip).
2. Finally, run `./xo-server`.

The first time you start XO-Server an `admin` user with the `admin` password is created.

## How to report a bug?

Do not report any bug against this version for now, thank you :)
