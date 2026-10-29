<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# xo-server-package-manager

> XO Server plugin for managing system packages (apt) on the XO appliance

## Usage

Lists and upgrades the Debian packages of the XO appliance (apt only). Once loaded, the following REST routes are
available to administrators:

| Route                                                                 | Description                                                  |
| --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `GET /rest/v0/plugins/package-manager/updates`                        | Upgradable packages (from the local indexes) and reboot flag |
| `POST /rest/v0/plugins/package-manager/updates/actions/refresh`       | `apt-get update`                                             |
| `POST /rest/v0/plugins/package-manager/updates/actions/upgrade`       | Upgrade all packages, returns a task                         |
| `POST /rest/v0/plugins/package-manager/updates/:name/actions/upgrade` | Upgrade one package, returns a task                          |

The full apt output is in `/var/log/apt/term.log`.

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

[AGPL-3.0-or-later](https://spdx.org/licenses/AGPL-3.0-or-later) © [Vates SAS](https://vates.fr)
