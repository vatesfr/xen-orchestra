> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [Backup/Restore] Backup repositories attached to a proxy now also benefit from the faster, journal-replayed backup listing (PR [#10437](https://github.com/vatesfr/xen-orchestra/pull/10437))
- [XO6/StateHero] Update StateHero illustrations SVG to match current design system (PR [#10380](https://github.com/vatesfr/xen-orchestra/pull/10380))
- [i18n] Update Chinese (Simplified Han script), Czech, Dutch, Finnish, Italian, Norwegian, Persian, Portuguese, Russian, Slovak, Spanish and Turkish translations (PR [#10396](https://github.com/vatesfr/xen-orchestra/pull/10396))
- [Backup/Restore] A live mounted disk is released on its own once it is deleted, or the VM holding it is: its SR is forgotten and the backup is no longer served (PR [#10432](https://github.com/vatesfr/xen-orchestra/pull/10432))
- [Backup/Restore] When ufw is enabled, as on XOA and proxies, live mount opens its iSCSI port in it, for the host the disk is attached to and while it is mounted (`iscsi.manageFirewall = false` to turn it off) (PR [#10468](https://github.com/vatesfr/xen-orchestra/pull/10468))
- [XO6/BRs] Add backup repository list page (PR [#10247](https://github.com/vatesfr/xen-orchestra/pull/10247))
- [XO6/BRs] Add backup repository create form (PR [#10271](https://github.com/vatesfr/xen-orchestra/pull/10271))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [REST API] Keep collection events ordered per object (PR [#10446](https://github.com/vatesfr/xen-orchestra/pull/10446))
- [REST API] Wait for the XAPI objects before making a server connected (PR [#10446](https://github.com/vatesfr/xen-orchestra/pull/10446))
- [REST API] Do not record an server error when a connection attempt is aborted (PR [#10446](https://github.com/vatesfr/xen-orchestra/pull/10446))

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
- @vates/types minor
- @xen-orchestra/backups minor
- @xen-orchestra/mixins minor
- @xen-orchestra/proxy minor
- @xen-orchestra/rest-api patch
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- xen-api patch
- xo-remote-parser major
- xo-server minor

<!--packages-end-->
