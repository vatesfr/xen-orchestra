> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Dashboard/Health] Detect broken VHD chains and display missing parent VDIs (PR [#6356](https://github.com/vatesfr/xen-orchestra/pull/6356))
- [Proxy] Ability to bind a licence to an existing proxy (PR [#6348](https://github.com/vatesfr/xen-orchestra/pull/6348))
- [Backup] Implement encryption for backup files on storage (PR [#6321](https://github.com/vatesfr/xen-orchestra/pull/6321))
- [VM/Console] Don't connect if the [console is disabled](https://support.citrix.com/article/CTX217766/how-to-disable-the-console-for-the-vm-in-xencenter) [#6319](https://github.com/vatesfr/xen-orchestra/issues/6319)

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Plugin/auth-saml] Certificate input support multiline (PR [#6403](https://github.com/vatesfr/xen-orchestra/pull/6403))

### Packages to release

> When modifying a package, add it here with its release type.
>
> The format is the following: - `$packageName` `$releaseType`
>
> Where `$releaseType` is
>
> - patch: if the change is a bug fix or a simple code improvement
> - minor: if the change is a new feature
> - major: if the change breaks compatibility
>
> Keep this list alphabetically ordered to avoid merge conflicts

<!--packages-start-->

- @xen-orchestra/fs minor
- @xen-orchestra/mixins minor
- vhd-lib patch
- xo-server-auth-saml patch
- xo-server minor
- xo-web minor

<!--packages-end-->
