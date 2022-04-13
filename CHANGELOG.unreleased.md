> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Rolling Pool Update] New algorithm for XCP-ng updates

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Plugins] Automatically configure plugins when a configuration file is imported (PR [#6171](https://github.com/vatesfr/xen-orchestra/pull/6171))
- [VMDK Export] Fix `VBOX_E_FILE_ERROR (0x80BB0004)` when importing in VirtualBox (PR [#6163](https://github.com/vatesfr/xen-orchestra/pull/6163))
- [Backup] Fix "Cannot read properties of undefined" error when restoring from a proxied remote (PR [#6179](https://github.com/vatesfr/xen-orchestra/pull/6179))
- [Rolling Pool Update] Fix "cannot read properties of undefined" error [#6170](https://github.com/vatesfr/xen-orchestra/issues/6170) (PR [#6186](https://github.com/vatesfr/xen-orchestra/pull/6186))

### Packages to release

> Packages will be released in the order they are here, therefore, they should
> be listed by inverse order of dependency.
>
> Rule of thumb: add packages on top.
>
> The format is the following: - `$packageName` `$version`
>
> Where `$version` is
>
> - patch: if the change is a bug fix or a simple code improvement
> - minor: if the change is a new feature
> - major: if the change breaks compatibility
>
> In case of conflict, the highest (lowest in previous list) `$version` wins.

- xen-api minor
- xo-vmdk-to-vhd minor
- @xen-orchestra/proxy patch
- xo-server minor
