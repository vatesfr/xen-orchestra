<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @xen-orchestra/backups

[![Package Version](https://badgen.net/npm/v/@xen-orchestra/backups)](https://npmjs.org/package/@xen-orchestra/backups) ![License](https://badgen.net/npm/license/@xen-orchestra/backups) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@xen-orchestra/backups)](https://bundlephobia.com/result?p=@xen-orchestra/backups) [![Node compatibility](https://badgen.net/npm/node/@xen-orchestra/backups)](https://npmjs.org/package/@xen-orchestra/backups)

## Install

Installation of the [npm package](https://npmjs.org/package/@xen-orchestra/backups):

```sh
npm install --save @xen-orchestra/backups
```

## Usage

## Changing the default backup configuration

It is possible to change the default backup configuration by editing the XO configuration file (`config.toml`).

There are multiple sections concerning backups:

- `[backups]` contains values related to the general backup configuration
- `[backups.defaultSettings]`, `[backups.vm.defaultSettings]` and `[backups.metadata.defaultSettings]` contain values related to backup jobs default settings:
  - `[backups.vm.defaultSettings]` is related to VM backup jobs
  - `[backups.metadata.defaultSettings]` is related to metadata backup jobs
  - `[backups.defaultSettings]` is related to all backup jobs
  - in case of duplicate value, `[backups.vm.defaultSettings]` and `[backups.metadata.defaultSettings]` will prevail over `[backups.defaultSettings]`, and a defined job setting will prevail over any `defaultSettings`

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

[AGPL-3.0-or-later](https://spdx.org/licenses/AGPL-3.0-or-later) © [Vates SAS](https://vates.fr)
