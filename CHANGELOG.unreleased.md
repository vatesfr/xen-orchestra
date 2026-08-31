> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [XO6/Host] Add possibility to detach an host (PR [#10179](https://github.com/vatesfr/xen-orchestra/pull/10179))
- [XO5/New VM] Ability to add the VM to a resource set and to share it during creation (PR [#10259](https://github.com/vatesfr/xen-orchestra/pull/10259))
- [XO6/lite] Add possibility to add new Vif from VM > Network in XOLite, several repercussions on xo6 (PR [#10216](https://github.com/vatesfr/xen-orchestra/pull/10216))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [OpenMetrics] The Prometheus secret no longer changes on every xo-server restart: it is now generated once and saved in the plugin configuration (PR [#10290](https://github.com/vatesfr/xen-orchestra/pull/10290))

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

- @xen-orchestra/web minor
- xo-server minor
- xo-server-openmetrics patch
- xo-web minor

<!--packages-end-->
