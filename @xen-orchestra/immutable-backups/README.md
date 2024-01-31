<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @xen-orchestra/immutable-backups

## Usage

### make a remote immutable

launch the `xo-immutable-remote` command. The configuration is stored in the config file.
This script must be kept running to make file immutable reliably.

### make file mutable

launch the `xo-lift-remote-immutability` cli. The configuration is stored in the config file .

If the config file have a `liftEvery`, this script will contiue to run and check regularly if there are files to update.

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

[AGPL-3.0-or-later](https://spdx.org/licenses/AGPL-3.0-or-later) © [Vates SAS](https://vates.fr)
