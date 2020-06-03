<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# xo-server-transport-nagios

> Send backup runs statuses to Nagios

## Usage

Like all other xo-server plugins, it can be configured directly via
the web interface, see [the plugin documentation](https://xen-orchestra.com/docs/plugins.html).

### `Xo#sendPassiveCheck( { status, message })`

This xo method is called to send a passive check to nagios and change the status of a service.
It has two parameters:

- status: it's the service status in Nagios (0: OK | 1: WARNING | 2: CRITICAL).
- message: it's the status information in Nagios.

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

[AGPL-3.0-or-later](https://spdx.org/licenses/AGPL-3.0-or-later) © [Vates SAS](https://vates.fr)
