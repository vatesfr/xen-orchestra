> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Backup] Merge multiple VHDs at once which will speed up the merging ĥase after reducing the retention of a backup job(PR [#6184](https://github.com/vatesfr/xen-orchestra/pull/6184))
- [Backup] Implement file cache for listing the backups of a VM (PR [#6220](https://github.com/vatesfr/xen-orchestra/pull/6220))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [S3] Fix S3 remote with empty directory not showing anything to restore (PR [#6218](https://github.com/vatesfr/xen-orchestra/pull/6218))

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
>
> The `gen-deps-list` script can be used to generate this list of dependencies
> Run `scripts/gen-deps-list.js --help` for usage

<!--packages-start-->

- vhd-lib patch
- @xen-orchestra/fs patch
- vhd-cli patch
- xo-vmdk-to-vhd minor
- @xen-orchestra/upload-ova patch
- @xen-orchestra/backups minor
- @xen-orchestra/backups-cli patch
- @xen-orchestra/proxy minor
- xo-server minor
- xo-web minor

<!--packages-end-->
