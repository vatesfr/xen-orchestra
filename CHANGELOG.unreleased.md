> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [QA Test] Add end-to-end QA test suite `@xen-orchestra/qa-test` for VM, backup and export testing (PR [#9626](https://github.com/vatesfr/xen-orchestra/pull/9626))
- [i18n] Add Portuguese and Slovak and update Chinese (Simplified Han script), Czech, Dutch, German, Italian, Norwegian, Persian, Portuguese (Brasil), Russian, Spanish, Swedish and Ukrainian translations (PR [#9554](https://github.com/vatesfr/xen-orchestra/pull/9554))
- [Treeview/Pool/Host] Add button to download bugtools (PR [#9419](https://github.com/vatesfr/xen-orchestra/pull/9419))
- [REST API] Add `POST rest/v0/plugins/sdn-controller/vifs/:id/rules` and `DELETE rest/v0/plugins/sdn-controller/vifs/:id/rules` traffic rule endpoints for VIFs ([#9418](https://github.com/vatesfr/xen-orchestra/pull/9418))

### Bug fixes

- [Header]: Fix `Unable to connect to XO server` falshing every 30 secondes (PR [#9681](https://github.com/vatesfr/xen-orchestra/pull/9681))
- [Backups]: Fix regression on cleanVM speed (PR [#9692](https://github.com/vatesfr/xen-orchestra/pull/9692))
- [VM/new]: Fix Focus lost on vdi name input in new VM form (PR [\#9685](https://github.com/vatesfr/xen-orchestra/issues/9685))

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
- @xen-orchestra/rest-api patch
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- xo-server patch
- xo-server-netbox patch
- xo-server-sdn-controller minor

<!--packages-end-->
