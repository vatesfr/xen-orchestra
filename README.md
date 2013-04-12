# Xen Orchestra Web

XO-Web is part of [Xen Orchestra](https://github.com/vatesfr/xo), a web interface for [XCP](https://en.wikipedia.org/wiki/Xen_Cloud_Platform).

It is a web client for [XO-Server](https://github.com/vatesfr/xo-server).

__XO is currently under development and may be subject to important bugs.__

## Installation

_There is currently no package available for XO-Web, you must therefore use the following procedure._

1. Download the code, you may either use git `git clone git://github.com/vatesfr/xo-web` or download a [Zip archive](https://github.com/vatesfr/xo-web/archive/master.zip).
2. XO-Web uses [Composer](https://getcomposer.org) for its dependency management, so, once you have [installed it](https://getcomposer.org/download/), juste run `php composer.phar install`.
3. Makes sure the web server can read in the `public/` directory.
4. If you are using Apache2, make sure mod_rewrite is enabled and `.htaccess` files are working. Otherwise, configure your web server to handle all requests to non-existing files using `public/index.php`.

Optionnaly, if you want to alter XO-Web default configuration you may create the `config/local.php` file from `config/local.php.dist` and change its values.

## How to report a bug?

If you are certain the bug is exclusively related to XO-Web, you may use the [bugtracker of this repository](https://github.com/vatesfr/xo-web/issues).

Otherwise, please consider using the [bugtracker of the general repository](https://github.com/vatesfr/xo/issues).
