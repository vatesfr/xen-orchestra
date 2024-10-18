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
> xo-cli help
Usage:

  Global options:

    --allowUnauthorized, --au
      Accept invalid certificate (e.g. self-signed).

    --url <url>, -u <url>
      Specify an XO instance instance to use for the command instead of relying
      on the one registered.

      The URL must include credentials: https://token@xo.company.net/

  xo-cli register [--allowUnauthorized] [--expiresIn <duration>] [--otp <otp>] <XO-Server URL> <username> [<password>]
  xo-cli register [--allowUnauthorized] [--expiresIn <duration>] --token <token> <XO-Server URL>
    Registers the XO instance to use.

    --allowUnauthorized, --au
      Accept invalid certificate (e.g. self-signed).

    --expiresIn <duration>
      Can be used to change the validity duration of the
      authorization token (default: one month).

    --otp <otp>
      One-time password if required for this user.

    --token <token>
      An authentication token to use instead of username/password.

  xo-cli create-token <params>…
    Create an authentication token for XO API.

    <params>…
      Accept the same parameters as register, see its usage.

  xo-cli unregister
    Remove stored credentials.

  xo-cli list-commands [--json] [<pattern>]...
    Returns the list of available commands on the current XO instance.

    The patterns can be used to filter on command names.

  xo-cli list-objects [--<property>]… [<property>=<value>]...
    Returns a list of XO objects.

    --<property>
      Restricts displayed properties to those listed.

    <property>=<value>
      Restricted displayed objects to those matching the patterns.

  xo-cli <command> [--json] [<name>=<value>]...
    Executes a command on the current XO instance.

    --json
      Prints the result in JSON format.

  xo-cli rest del <resource>
    Delete the resource.

    Examples:
      xo-cli rest del tasks/<task id>
      xo-cli rest del vms/<vm id>/tags/<tag>

  xo-cli rest get <collection> [fields=<fields>] [filter=<filter>] [limit=<limit>]
    List objects in a REST API collection.

    <collection>
      Full path of the collection to list

    fields=<fields>
      When provided, returns a collection of objects containing the requested
      fields instead of the simply the objects' paths.

      The field names must be separated by commas.

    filter=<filter>
      List only objects that match the filter

      Syntax: https://xen-orchestra.com/docs/manage_infrastructure.html#filter-syntax

    limit=<limit>
      Maximum number of objects to list, e.g. `limit=10`

    Examples:
      xo-cli rest get
      xo-cli rest get tasks filter='status:pending'
      xo-cli rest get vms fields=name_label,power_state

  xo-cli rest get [--output <file>] <object> [wait | wait=result]
    Show an object from the REST API.

    --output <file>
      If specified, the response will be saved in <file> instead of being parsed.

      If <file> ends with `/`, it will be considered as the directory in which
      to save the response, and the filename will be last part of the <object> path.

    <object>
      Full path of the object to show

    wait
      If the object is a task, waits for it to be updated before returning.

    wait=result
      If the object is a task, waits for it to be finished before returning.

    Examples:
      xo-cli rest get vms/<VM UUID>
      xo-cli rest get tasks/<task id>/actions wait=result

  xo-cli rest patch <object> <name>=<value>...
    Update properties of an object (not all properties are writable).

    <object>
      Full path of the object to update

    <name>=<value>...
      Properties to update on the object

    Examples:
      xo-cli rest patch vms/<VM UUID> name_label='My VM' name_description='Its description

  xo-cli rest post <action> <name>=<value>...
    Execute an action.

    <action>
      Full path of the action to execute

    <name>=<value>...
      Paramaters to pass to the action

    Examples:
      xo-cli rest post tasks/<task id>/actions/abort
      xo-cli rest post vms/<VM UUID>/actions/snapshot name_label='My snapshot'

  xo-cli rest put <collection>/<item id> <name>=<value>...
    Put a item in a collection

    <collection>/<item id>
      Full path of the item to add

    <name>=<value>...
      Properties of the item

    Examples:
      xo-cli rest put vms/<vm id>/tags/<tag>

  xo-cli watch [--ndjson]
    Watch and display notifications received from the XO instance

    --ndjson
      Prints the result in newline-delimited JSON format

```

#### Register your XO instance

```
> xo-cli register http://xo.my-company.net admin@admin.net admin
Successfully logged with admin@admin.net
```

Note: only a token will be saved in the configuration file.

#### List available objects

Prints all objects:

```
> xo-cli list-objects
```

It is possible to filter on object properties, for instance to prints
all VM templates:

```
> xo-cli list-objects type=VM-template
```

#### List available commands

```
> xo-cli list-commands
```

Commands can be filtered using patterns:

```
> xo-cli list-commands '{user,group}.*'
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
