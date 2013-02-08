# Xen Orchestra Web

XO-Web is part of [Xen Orchestra](https://github.com/vatesfr/xo), a web interface for [XCP](https://en.wikipedia.org/wiki/Xen_Cloud_Platform).

It is a web client for [XO-Server](https://github.com/vatesfr/xo-web).

__XO is currently under development and may be subject to important bugs.__

## Installation

_There is currently no package available for XO-Web, you must therefore use the following procedure._

1. Download the code, you may either use git `git clone git://github.com/vatesfr/xo-web` or download a [Zip archive](https://github.com/vatesfr/xo-web/archive/master.zip).
2. XO-Web uses [Composer](https://getcomposer.org) for its dependency management, so, once you have [installed it](https://getcomposer.org/download/), juste run `php composer.phar install`.
3. Copy `src/config/local.php.dist` to `src/config/local.php` and complete the configuration.
4. Makes sure the `src/www` directory and all its content is available from your web server.

## How to report a bug?

If you are certain the bug is exclusively related to XO-Web, you may use the [bugtracker of this repository](https://github.com/vatesfr/xo-web/issues).

Otherwise, please consider using the [bugtracker of the general repository](https://github.com/vatesfr/xo/issues).
