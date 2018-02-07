# xo-server-transport-nagios [![Build Status](https://travis-ci.org/vatesfr/xen-orchestra.png?branch=master)](https://travis-ci.org/vatesfr/xen-orchestra)

> ${pkg.description}

## Install

Installation of the [npm package](https://npmjs.org/package/xo-server-transport-nagios):

```
> npm install --global xo-server-transport-nagios
```

## Usage

Like all other xo-server plugins, it can be configured directly via
the web interface, see [the plugin documentation](https://xen-orchestra.com/docs/plugins.html).

## Development

### `Xo#sendPassiveCheck( { status, message }) `

This xo method is called to send a passive check to nagios and change the status of a service.
It has two parameters:
- status: it's the service status in Nagios (0: OK | 1: WARNING | 2: CRITICAL).
- message: it's the status information in Nagios.

```
# Install dependencies
> npm install

# Run the tests
> npm test

# Continuously compile
> npm run dev

# Continuously run the tests
> npm run dev-test

# Build for production (automatically called by npm install)
> npm run build
```

## Contributions

Contributions are *very* welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

AGPL3 © [Vates SAS](https://vates.fr)
