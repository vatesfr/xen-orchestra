# xo-cli

After [a request from someone on our Github repository](https://github.com/vatesfr/xo-server/issues/23), we decided to add the possibility to do some actions with CLI. Just few hours after the request, [we created XO-cli](https://github.com/vatesfr/xo-cli). It's a real example of the Xen Orchestra modularity, and how we can be flexible.

Thanks to introspection, XO-cli will detect all the available features exposed in XO-server API.

## Usage

```
  xo-cli --register [<XO-Server URL>] [<username>] [<password>]
    Registers the XO instance to use.

  xo-cli --list-commands [--json]
    Returns the list of available commands on the current XO instance.

  xo-cli --list-objects [<property>=<value>]...
    Returns a list of XO objects.

  xo-cli <command> [<name>=<value>]...
    Executes a command on the current XO instance.

```

## Examples

List all running VMs on your entire infrastructure, filtering on their name:

```
$ xo-cli --list-objects type=VM power_state=Running | grep name_label

    "name_label": "test tools",
    "name_label": "nfs",
    "name_label": "Salt Master",

```

You can list all the exposed XO-server API methods:

```
$ xo-cli --list-commands

...
vm.export vm=<string> [compress=<boolean>] [onlyMetadata=<boolean>]
vm.import host=<string>
...

```