> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- **XO 6:**
  - [Navigation] Navigation state is now persisted in localStorage and items are now collapsible while filtering. (PR [#9277](https://github.com/vatesfr/xen-orchestra/pull/9277))

- [Backups/s3] Update filesystem handling to use DeleteObjectsCommand in order to improve performance (PR [#9281](https://github.com/vatesfr/xen-orchestra/pull/9281))
- [REST API] Add link to the openAPI JSON directly in the swagger description (PR [#9285](https://github.com/vatesfr/xen-orchestra/pull/9285))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Backups] Allow offline backups for more types of backups [Forum#11578](https://xcp-ng.org/forum/topic/11578) (PR [#9228](https://github.com/vatesfr/xen-orchestra/pull/9228))
- [xo-server] better handling of xapi snapshots when converting to xo object (PR [#9231](https://github.com/vatesfr/xen-orchestra/pull/9231))
- [REST API/VM Dashboard] Return `vmProtection: 'protected' | 'unprotected' | 'not-in-job'` instead of `vmProtected: boolean` (PR [#9288](https://github.com/vatesfr/xen-orchestra/pull/9288))
- [Backup]clean up .vhd.checksum files (PR [#9291](https://github.com/vatesfr/xen-orchestra/pull/9291))
- [Backup] Prevent "No new data to upload for this VM" info on mirror backups when it was false [Forum#11623](https://xcp-ng.org/forum/topic/11623) (PR [#9286](https://github.com/vatesfr/xen-orchestra/pull/9286))

- **XO 6:**
  - [VDIs] Fix broken fallback link to XO 5 VDIs page (PR [#9267](https://github.com/vatesfr/xen-orchestra/pull/9267))
  - Redirect non admin user to XO5 (PR [#9219](https://github.com/vatesfr/xen-orchestra/pull/9219))

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
- @xen-orchestra/fs patch
- @xen-orchestra/rest-api patch
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- xo-web patch


<!--packages-end-->
