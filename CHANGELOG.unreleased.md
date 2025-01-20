> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- **XO 6**:
  - [Console]: Displays a loader when the console is loading (PR [#8226](https://github.com/vatesfr/xen-orchestra/pull/8226))
  - [i18n] Add Spanish translation (contribution made by [@DSJ2](https://github.com/DSJ2)) (PR [#8220](https://github.com/vatesfr/xen-orchestra/pull/8220))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- Fix SR tags not being listed in tag selectors (PR [#8251](https://github.com/vatesfr/xen-orchestra/pull/8251))
- [Plugins/usage-report] Prevent the report creation from failing over and over when previous stats file is empty or incorrect (PR [#8240](https://github.com/vatesfr/xen-orchestra/pull/8240))
- [Backups/Logs] Display mirror backup transfer size (PR [#8224](https://github.com/vatesfr/xen-orchestra/pull/8224))
- [Settings/Remotes] Only allow using encryption when using data block storage to prevent errors during backups (PR [#8244](https://github.com/vatesfr/xen-orchestra/pull/8244))

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
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- xo-server patch
- xo-server-usage-report patch
- xo-web patch

<!--packages-end-->
