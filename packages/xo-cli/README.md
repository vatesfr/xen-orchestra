# XO-CLI
[![Build Status](https://travis-ci.org/vatesfr/xen-orchestra.png?branch=master)](http://travis-ci.org/vatesfr/xen-orchestra)
[![Dependency Status](https://david-dm.org/vatesfr/xo-cli/status.svg?theme=shields.io)](https://david-dm.org/vatesfr/xo-cli)
[![devDependency Status](https://david-dm.org/vatesfr/xo-cli/dev-status.svg?theme=shields.io)](https://david-dm.org/vatesfr/xo-cli#info=devDependencies)

> Basic CLI for Xen-Orchestra

## Install

#### [npm](https://npmjs.org/package/xo-cli)

```
npm install -g xo-cli
```

## Usage

```
> xo-cli --help
Usage:

  xo-cli --register [--expiresIn duration] <XO-Server URL> <username> [<password>]
    Registers the XO instance to use.

    --expiresIn duration
      Can be used to change the validity duration of the
      authorization token (default: one month).

  xo-cli --unregister
    Remove stored credentials.

  xo-cli --list-commands [--json] [<pattern>]...
    Returns the list of available commands on the current XO instance.

    The patterns can be used to filter on command names.

  xo-cli --list-objects [--<property>]… [<property>=<value>]...
    Returns a list of XO objects.

    --<property>
      Restricts displayed properties to those listed.

    <property>=<value>
      Restricted displayed objects to those matching the patterns.

  xo-cli <command> [<name>=<value>]...
    Executes a command on the current XO instance.
```

#### Register your XO instance

```
> xo-cli --register http://xo.my-company.net admin@admin.net admin
Successfully logged with admin@admin.net
```

Note: only a token will be saved in the configuration file.

#### List available objects

Prints all objects:

```
> xo-cli --list-objects
```

It is possible to filter on object properties, for instance to prints
all VM templates:

```
> xo-cli --list-objects type=VM-template
```

#### List available commands

```
> xo-cli --list-commands
```

Commands can be filtered using patterns:

```
> xo-cli --list-commands '{user,group}.*'
```

#### Execute a command

The same syntax is used for all commands: `xo-cli <command> <param
name>=<value>...`

E.g., adding a new server:

```
> xo-cli server.add host=my.server.net username=root password=secret-password
42
```

The return value is the identifier of this new server in XO.

Parameters (except `true` and `false` which are correctly parsed as
booleans) are assumed to be strings, for other types, you may use JSON
encoding by prefixing with `json:`:

```
> xo-cli foo.bar baz='json:[1, 2, 3]'
```

##### Configuration export

```
> xo-cli xo.exportConfig @=config.json
```

##### VM export

```
> xo-cli vm.export vm=a01667e0-8e29-49fc-a550-17be4226783c @=vm.xva
```

##### VM import

 ```
> xo-cli vm.import host=60a6939e-8b0a-4352-9954-5bde44bcdf7d @=vm.xva
```

## Development

```
# Install dependencies
> yarn

# Run the tests
> yarn test

# Continuously compile
> yarn dev

# Continuously run the tests
> yarn dev-test

# Build for production (automatically called by npm install)
> yarn build
```

## Contributions

Contributions are *very* welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

XO-CLI is released under the [AGPL
v3](http://www.gnu.org/licenses/agpl-3.0-standalone.html).
