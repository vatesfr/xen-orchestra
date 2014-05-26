# XO-CLI
[![Build Status](https://img.shields.io/travis/vatesfr/xo-cli/master.svg)](http://travis-ci.org/vatesfr/xo-cli)
[![Dependency Status](https://david-dm.org/vatesfr/xo-cli/status.svg?theme=shields.io)](https://david-dm.org/vatesfr/xo-cli)
[![devDependency Status](https://david-dm.org/vatesfr/xo-cli/dev-status.svg?theme=shields.io)](https://david-dm.org/vatesfr/xo-cli#info=devDependencies)

> Basic CLI for Xen-Orchestra

## Installation

#### [npm](https://npmjs.org/package/xo-cli)

```
npm install -g xo-cli
```

## Usage

#### Register your XO instance

```
xo-cli --register http://xo.my-company.net/api/admin@admin.net admin
```

Note: only a token will be saved in the configuration file.

#### List available commands

```
xo-cli --list-commands
```

#### Execute a command

The same syntax is used for all commands: `xo-cli <command> <param
name>=<value>...`

E.g., adding a new server:

```
xo-cli server.add my.server.net root secret-password
42
```

The return value is the identifier of this new server in XO.

## Contributing

Contributions are *very* welcome, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xo-cli/issues)
  you've encountered;
- fork and create a pull request.

## License

XO-CLI is released under the [AGPL
v3](http://www.gnu.org/licenses/agpl-3.0-standalone.html).
