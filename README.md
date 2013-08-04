# Xen Orchestra Server

**This is a test implementation using node.js.**

XO-Server is part of [Xen Orchestra](https://github.com/vatesfr/xo), a web interface for XenServer or XAPI enabled hosts.

It contains all the logic of XO and handles:

- connections to all XAPI servers/pools;
- a cache system to provide the best response time possible;
- users authentication and authorizations;
- a JSON-RPC based interface for XO clients (i.e. [XO-Web](https://github.com/vatesfr/xo-web)).

__XO is currently under development and may be subject to important bugs.__

## Installation

_There is currently no package available for XO-Server, you must therefore use the following procedure._

1. Download the code, you may either use git `git clone git://github.com/vatesfr/xo-server` or download a [Zip archive](https://github.com/vatesfr/xo-server/archive/master.zip).
2. You need [node.js](http://nodejs.org/) running. Go in the xo-server folder and do a `npm update && npm install`.
3. Go into `public/http` folder and symlink to xo-web by doing this: `for f in ../../../xo-web/public/*; do ln -s "$f" .;done`
4. Finally, run `./xo-server`, your XO install is available on `http://IPADDRESS:8080`

## How to report a bug?

Do not report any bug against this version for now, thank you :)
