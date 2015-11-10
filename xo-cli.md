# xo-cli

After [a request from someone on our Github repository](https://github.com/vatesfr/xo-server/issues/23), we decided to add the possibility to do some actions with CLI. Just few hours after the request, [we created XO-cli](https://github.com/vatesfr/xo-cli). It's a real example of the Xen Orchestra modularity, and how we can be flexible.

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

