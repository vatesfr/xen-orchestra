> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- Limit number of concurrent VM migrations per pool to `3` [#6065](https://github.com/vatesfr/xen-orchestra/issues/6065) (PR [#6076](https://github.com/vatesfr/xen-orchestra/pull/6076))
  Can be changed in `xo-server`'s configuration file: `xapiOptions.vmMigrationConcurrency`
- [Proxy] Now ships a reverse proxy [PR#6072](https://github.com/vatesfr/xen-orchestra/pull/6072)
- [Delta Backup] When using S3 remote, retry uploading VHD parts on Internal Error to support [Blackblaze](https://www.backblaze.com/b2/docs/calling.html#error_handling) (PR [#6086](https://github.com/vatesfr/xen-orchestra/issues/6086)) (Forum [5397](https://xcp-ng.org/forum/topic/5397/delta-backups-failing-aws-s3-uploadpartcopy-cpu-too-busy/5))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Backup] Detect and clear orphan merge states, fix `ENOENT` errors (PR [#6087](https://github.com/vatesfr/xen-orchestra/pull/6087))

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

- @xen-orchestra/fs minor
- vhd-lib minor
- @xen-orchestra/backups minor
- @xen-orchestra/backups-cli minor
- @xen-orchestra/proxy minor
- xo-server minor
