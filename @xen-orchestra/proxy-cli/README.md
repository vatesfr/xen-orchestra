<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @xen-orchestra/proxy-cli

[![Package Version](https://badgen.net/npm/v/@xen-orchestra/proxy-cli)](https://npmjs.org/package/@xen-orchestra/proxy-cli) ![License](https://badgen.net/npm/license/@xen-orchestra/proxy-cli) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@xen-orchestra/proxy-cli)](https://bundlephobia.com/result?p=@xen-orchestra/proxy-cli) [![Node compatibility](https://badgen.net/npm/node/@xen-orchestra/proxy-cli)](https://npmjs.org/package/@xen-orchestra/proxy-cli)

> CLI for @xen-orchestra/proxy

## Install

Installation of the [npm package](https://npmjs.org/package/@xen-orchestra/proxy-cli):

```sh
npm install --global @xen-orchestra/proxy-cli
```

## Usage

```
$ xo-proxy-cli --help

Usage:

  xo-proxy-cli <method> [<param>=<value>]...
    Call a method of the API and display its result.

  xo-proxy-cli [--file | -f] <file>
    Read a CSON or JSON file containing an object with `method` and `params`
    properties and call the API method.

    The file can also contain an array containing multiple calls, which will be
    run in sequence.
```

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

[AGPL-3.0-or-later](https://spdx.org/licenses/AGPL-3.0-or-later) © [Vates SAS](https://vates.fr)
