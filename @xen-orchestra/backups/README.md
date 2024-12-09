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

This library receives a backup configuration from `xo-server` or `xo-proxy`. This configuration is split between multiple properties:

- `config` contains values related to the general backup configuration
- `config.defaultSettings`, `config.vm.defaultSettings` and `config.metadata.defaultSettings` contain values related to backup jobs default settings:
  - `config.vm.defaultSettings` is related to VM backup jobs (see [DEFAULT_XAPI_VM_SETTINGS](https://github.com/vatesfr/xen-orchestra/blob/568e14f7eec7c3ddf685d324ad4733a3ef577995/%40xen-orchestra/backups/_runners/VmsRemote.mjs#L15))
  - `config.metadata.defaultSettings` is related to metadata backup jobs (see [DEFAULT_METADATA_SETTINGS](https://github.com/vatesfr/xen-orchestra/blob/568e14f7eec7c3ddf685d324ad4733a3ef577995/%40xen-orchestra/backups/_runners/Metadata.mjs#L12))
  - `config.defaultSettings` is related to all backup jobs (see [DEFAULT_SETTINGS](https://github.com/vatesfr/xen-orchestra/blob/568e14f7eec7c3ddf685d324ad4733a3ef577995/%40xen-orchestra/backups/_runners/_Abstract.mjs#L7))
  - in case of duplicate value, `config.vm.defaultSettings` and `config.metadata.defaultSettings` will prevail over `config.defaultSettings`, and a defined job setting will prevail over any `defaultSettings`

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

[AGPL-3.0-or-later](https://spdx.org/licenses/AGPL-3.0-or-later) © [Vates SAS](https://vates.fr)
