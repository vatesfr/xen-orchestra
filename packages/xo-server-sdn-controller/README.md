# xo-server-sdn-controller [![Build Status](https://travis-ci.org/vatesfr/xen-orchestra.png?branch=master)](https://travis-ci.org/vatesfr/xen-orchestra)

XO Server plugin that allows the creation of pool-wide private networks.

## Install

For installing XO and the plugins from the sources, please take a look at [the documentation](https://xen-orchestra.com/docs/from_the_sources.html).

## Usage

### Network creation

In the network creation view, select a `pool` and `Private network`.
Create the network.

### Configuration

Like all other xo-server plugins, it can be configured directly via
the web interface, see [the plugin documentation](https://xen-orchestra.com/docs/plugins.html).

The plugin's configuration contains:
- `cert-dir`: A path where to find the certificates to create SSL connections with the hosts.
If none is provided, the plugin will create its own self-signed certificates.
- `override-certs:` Whether or not to uninstall an already existind SDN controller CA certificate in order to replace it by the plugin's ones.

## Contributions

Contributions are *very* welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

AGPL3 © [Vates SAS](http://vates.fr)
