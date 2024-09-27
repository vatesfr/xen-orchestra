> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Hosts] Display a warning for hosts whose TLS key is too short to update to XCP-ng 8.3 (PR [#7995](https://github.com/vatesfr/xen-orchestra/pull/7995))
- **XO 6**:
  - [Dashboard] Display S3 backup repository data (PR [#8006](https://github.com/vatesfr/xen-orchestra/pull/8006))
  - [Dashboard] Display VMs protection data (PR [#8007](https://github.com/vatesfr/xen-orchestra/pull/8007))
- **xo-cli**
  - `rest get --output $file` now displays progress information during download
  - `rest post` and `rest put` now accept `--input $file` to upload a file and display progress information
- [Backup] Detect invalid VDI exports that are incorrectly reported as successful by XAPI
- [Backup] Backup job sequences: configure lists of backup jobs to run in order one after the other (PRs [#7985](https://github.com/vatesfr/xen-orchestra/pull/7985), [#8014](https://github.com/vatesfr/xen-orchestra/pull/8014))
- [Pool/Network] Display the bond mode of a network [#7802](https://github.com/vatesfr/xen-orchestra/issues/7802) (PR [#8010](https://github.com/vatesfr/xen-orchestra/pull/8010))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [REST API] Fix broken _Rolling Pool Update_ pool action [Forum#82867](https://xcp-ng.org/forum/post/82867)

### Packages to release

> When modifying a package, add it here with its release type.
>
> The format is the following: `- $packageName $releaseType`
>
> Where `$releaseType` is
>
> - patch: if the change is a bug fix or a simple code improvement
> - minor: if the change is a new feature
> - major: if the change breaks compatibility
>
> Keep this list alphabetically ordered to avoid merge conflicts

<!--packages-start-->

- @xen-orchestra/backups minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- @xen-orchestra/xapi minor
- xen-api minor
- xo-cli minor
- xo-server minor
- xo-web minor

<!--packages-end-->
