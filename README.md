# Xen Orchestra Server

XO-Server is part of [Xen Orchestra](https://github.com/vatesfr/xo), a web interface for [XCP](https://en.wikipedia.org/wiki/Xen_Cloud_Platform).

It contains all the logic of XO and handles:

- connections to all XCP servers/pools;
- a cache system to provide the best response time possible;
- users authentication and authorizations;
- a JSON-RPC based interface for XO clients (i.e. [XO-Web](https://github.com/vatesfr/xo-web)).

__XO is currently under development and may be subject to important bugs.__

## Installation

_There is currently no package available for XO-Server, you must therefore use the following procedure._

First of all, you have to download the code, you may either use git `git clone git://github.com/vatesfr/xo-server` or download a [Zip archive](https://github.com/vatesfr/xo-server/archive/master.zip).

XO-Server uses [Composer](https://getcomposer.org) for its dependency management, so all you have to do is `php composer.phar install`.

Finally, copy `src/config/local.php.dist` to `src/config/local.php` and complete the configuration.

You are now all set, you may run `./src/xo-server`.

## How to report a bug?

If you are certain the bug is exclusively related to XO-Server, you may use the [bugtracker of this repository](https://github.com/vatesfr/xo-server/issues).

Otherwise, please consider using the [bugtracker of the general repository](https://github.com/vatesfr/xo/issues).
