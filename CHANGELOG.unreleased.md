> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [HUB Recipe] Support custom cluster CIDR and Xo CCM (Cloud Controller Manager) in Pyrgos recipe
- [Disk] Add warning before disconnecting a VBD (PR [#9211](https://github.com/vatesfr/xen-orchestra/pull/9211))
- [REST API] Expose `GET /rest/v0/events` to open an SSE connection (PR [#9130](https://github.com/vatesfr/xen-orchestra/pull/9130))
- [REST API] Expose `POST /rest/v0/events/:id/subscriptions` to add a subscription in the SSE connection (PR [#9130](https://github.com/vatesfr/xen-orchestra/pull/9130))
- [REST API] Expose `DELETE /rest/v0/events/:id/subscriptions` to remove a subscription in the SSE connection (PR [#9130](https://github.com/vatesfr/xen-orchestra/pull/9130))
- [Backup] Add warning message: enabling/disabling backup job from VM > Backup affects all VMs in the job (PR [#9155](https://github.com/vatesfr/xen-orchestra/pull/9155))
- [Plugins/Usage Report] Add operating system information to reports - displays OS distribution statistics and includes OS details (name, distribution, version) in both HTML reports and CSV exports (PR [#9179](https://github.com/vatesfr/xen-orchestra/pull/9179))
- [AUTH] Import user groups from OIDC (PR [TODO](TODO))
- **XO 6:**
  - [New/VM] Display unsupported features information message (PR [#9203](https://github.com/vatesfr/xen-orchestra/pull/9203))
  - [i18n] Update Czech, German, French, Italian, Dutch, Portuguese (Brazil), and Ukrainian translations, and add Danish translation (PR [#9165](https://github.com/vatesfr/xen-orchestra/pull/9165))

### Bug fixes
- [V2V] fix transfer failing at 99% for unaligned disk (PR [#9233](https://github.com/vatesfr/xen-orchestra/pull/9233))

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

- @vates/nbd-client patch
- @vates/types minor
- @xen-orchestra/backups patch
- @xen-orchestra/rest-api minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- @xen-orchestra/xapi patch
- vhd-lib patch
- xo-collection minor
- xo-server minor
- xo-server-auth-oidc minor
- xo-server-usage-report minor
- xo-web minor

<!--packages-end-->
