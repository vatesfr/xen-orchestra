<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @xen-orchestra/backups-cli

[![Package Version](https://badgen.net/npm/v/@xen-orchestra/backups-cli)](https://npmjs.org/package/@xen-orchestra/backups-cli) ![License](https://badgen.net/npm/license/@xen-orchestra/backups-cli) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@xen-orchestra/backups-cli)](https://bundlephobia.com/result?p=@xen-orchestra/backups-cli) [![Node compatibility](https://badgen.net/npm/node/@xen-orchestra/backups-cli)](https://npmjs.org/package/@xen-orchestra/backups-cli)

## Install

Installation of the [npm package](https://npmjs.org/package/@xen-orchestra/backups-cli):

```sh
npm install --global @xen-orchestra/backups-cli
```

## Usage

```
> xo-backups --help
Usage:

    xo-backups clean-vms [--merge] [--remove] xo-vm-backups/*

    alternatively you can target the full remote, thus handling S3/Azure or encrypted remotes

    xo-backups clean-vms [--merge] [--remove] --remote=REMOTEURL

      Detects and repair issues with VM backups.

      Options:
        -m, --merge     Merge (or continue merging) VHD files that are unused
        -r, --remove    Remove unused, incomplete, orphan, or corrupted files


    xo-backups create-symlink-index xo-vm-backups <field path>

    xo-backups info xo-vm-backups/*
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
