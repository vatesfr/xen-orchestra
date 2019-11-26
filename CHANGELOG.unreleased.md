> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Backup NG] Make report recipients configurable in the backup settings [#4581](https://github.com/vatesfr/xen-orchestra/issues/4581) (PR [#4646](https://github.com/vatesfr/xen-orchestra/pull/4646))
- [SAML] Setting to disable requested authentication context (helps with _Active Directory_) (PR [#4675](https://github.com/vatesfr/xen-orchestra/pull/4675))
- The default sign-in page can be configured via `authentication.defaultSignInPage` (PR [#4678](https://github.com/vatesfr/xen-orchestra/pull/4678))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Metadata backup] Add 10 minutes timeout to avoid stuck jobs [#4657](https://github.com/vatesfr/xen-orchestra/issues/4657) (PR [#4666](https://github.com/vatesfr/xen-orchestra/pull/4666))
- [Metadata backups] Fix out-of-date listing for 1 minute due to cache (PR [#4672](https://github.com/vatesfr/xen-orchestra/pull/4672))

### Released packages

> Packages will be released in the order they are here, therefore, they should
> be listed by inverse order of dependency.
>
> Rule of thumb: add packages on top.

- xo-server-auth-saml v0.7.0
- xo-server-backup-reports v0.16.4
- @xen-orchestra/fs v0.10.2
- xo-server v5.53.0
- xo-web v5.53.0
