<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# xo-cli

[![Package Version](https://badgen.net/npm/v/xo-cli)](https://npmjs.org/package/xo-cli) ![License](https://badgen.net/npm/license/xo-cli) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/xo-cli)](https://bundlephobia.com/result?p=xo-cli) [![Node compatibility](https://badgen.net/npm/node/xo-cli)](https://npmjs.org/package/xo-cli)

> Basic CLI for Xen-Orchestra

## Install

Installation of the [npm package](https://npmjs.org/package/xo-cli):

```sh
npm install --global xo-cli
```

## Usage

```
> xo-cli --help
Usage:

  xo-cli --register [--allowUnauthorized] [--expiresIn <duration>] <XO-Server URL> <username> [<password>]
  xo-cli --register [--allowUnauthorized] [--expiresIn <duration>] --token <token> <XO-Server URL>
    Registers the XO instance to use.

    --allowUnauthorized, --au
      Accept invalid certificate (e.g. self-signed).

    --expiresIn <duration>
      Can be used to change the validity duration of the
      authorization token (default: one month).

    --token <token>
      An authentication token to use instead of username/password.

  xo-cli --createToken <params>…
    Create an authentication token for XO API.

    <params>…
      Accept the same parameters as --register, see its usage.

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

  xo-cli <command> [--json] [<name>=<value>]...
    Executes a command on the current XO instance.

    --json
      Prints the result in JSON format.
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

The same syntax is used for all commands: `xo-cli <command> <param name>=<value>...`

E.g., adding a new server:

```
> xo-cli server.add host=my.server.net username=root password=secret-password
42
```

The return value is the identifier of this new server in XO.

Because command lines are usually untyped, parameters (except `true` and `false` which are considered as
booleans) are assumed as strings by default, other types must be encoded as JSON and prefixed by `json:`:

```
> xo-cli method string=foo number=json:42 array=json:'["item1", "item2"]'
```

##### Configuration export

```
> xo-cli xo.exportConfig @=config.json
```

##### VM export

```
> xo-cli vm.export vm=a01667e0-8e29-49fc-a550-17be4226783c @=vm.xva
```

##### XVA VM import

```
> xo-cli vm.import sr=60a6939e-8b0a-4352-9954-5bde44bcdf7d @=vm.xva
```

> Note: `xo-cli` only supports the import of XVA files. It will not import OVA files.

##### OVA VM import

A separate utility, [`xo-upload-ova`](https://github.com/vatesfr/xen-orchestra/blob/master/@xen-orchestra/upload-ova/README.md), can be used to import `.ova` files.

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

[AGPL-3.0-or-later](https://spdx.org/licenses/AGPL-3.0-or-later) © [Vates SAS](https://vates.fr)
