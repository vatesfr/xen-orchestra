> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [Backup] fix transfer size only counting the last disk transferred (PR [#9900](https://github.com/vatesfr/xen-orchestra/pull/9900))
- [Backup] fix backup cleanup removing too many files when listing fails (PR [#9925](https://github.com/vatesfr/xen-orchestra/pull/9925))
- **XO 5**:
  - [Jobs] fix array values being incorrectly handled (used for instance on job.runSequence) (PR [#9928](https://github.com/vatesfr/xen-orchestra/pull/9928))

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

- @xen-orchestra/backup-archive patch
- @xen-orchestra/backups patch
- @xen-orchestra/vmware-explorer patch
- @xen-orchestra/xva patch
- xo-server patch
- xo-web patch

<!--packages-end-->
