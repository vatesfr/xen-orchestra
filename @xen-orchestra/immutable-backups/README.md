<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @xen-orchestra/immutable-backups

[![Package Version](https://badgen.net/npm/v/@xen-orchestra/immutable-backups)](https://npmjs.org/package/@xen-orchestra/immutable-backups) ![License](https://badgen.net/npm/license/@xen-orchestra/immutable-backups) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@xen-orchestra/immutable-backups)](https://bundlephobia.com/result?p=@xen-orchestra/immutable-backups) [![Node compatibility](https://badgen.net/npm/node/@xen-orchestra/immutable-backups)](https://npmjs.org/package/@xen-orchestra/immutable-backups)

## Install

Installation of the [npm package](https://npmjs.org/package/@xen-orchestra/immutable-backups):

```sh
npm install --save @xen-orchestra/immutable-backups
```

## Usage

### make a remote immutable

launch the `xo-immutable-remote` command. The configuration is stored in the config file.
This script must be kept running to make file immutable reliably.

### make file mutable

launch the `xo-lift-remote-immutability` cli. The configuration is stored in the config file .

If the config file have a `liftEvery`, this script will continue to run and check regularly if there are files to update.

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

[AGPL-3.0-or-later](https://spdx.org/licenses/AGPL-3.0-or-later) © [Vates SAS](https://vates.fr)
