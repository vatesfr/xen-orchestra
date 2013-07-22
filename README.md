# Xen Orchestra Server

XO-Server is part of [Xen Orchestra](https://github.com/vatesfr/xo), a web interface for XenServer (or XAPI enabled) hosts.

It contains all the logic of XO and handles:

- connections to all XCP servers/pools;
- a cache system to provide the best response time possible;
- users authentication and authorizations;
- a JSON-RPC based interface for XO clients (i.e. [XO-Web](https://github.com/vatesfr/xo-web)).

__XO is currently under development and may be subject to important bugs.__

## Installation

_There is currently no package available for XO-Server, you must therefore use the following procedure._

1. Download the code, you may either use git `git clone git://github.com/vatesfr/xo-server` or download a [Zip archive](https://github.com/vatesfr/xo-server/archive/master.zip).
2. XO-Web uses [Composer](https://getcomposer.org) for its dependency management, so, once you have [installed it](https://getcomposer.org/download/), juste run `php composer.phar install`.
3. Copy `config/local.php.dist` to `config/local.php` and complete the configuration.
4. Finally, run `./xo-server`.

The first time you start XO-Server an `admin` user with the `admin` password is created.

## How to report a bug?

If you are certain the bug is exclusively related to XO-Server, you may use the [bugtracker of this repository](https://github.com/vatesfr/xo-server/issues).

Otherwise, please consider using the [bugtracker of the general repository](https://github.com/vatesfr/xo/issues).
