> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [XO6/Traffic rules] Add possibility of editing a traffic rule (PR [#10056](https://github.com/vatesfr/xen-orchestra/pull/10056))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [Backups] Fix slow replication startup and fallback to full on qcow2 (PR [#10319](https://github.com/vatesfr/xen-orchestra/pull/10319))

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

- @xen-orchestra/backups patch
- @xen-orchestra/xapi patch
<!--packages-end-->
