> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [REST API] Support exporting VM in OVA format
- [XOA/Licenses] Ability to manually bind XOSTOR licenses following new licenses (PR [#7573](https://github.com/vatesfr/xen-orchestra/pull/7573))
- [xo-cli] Ability to connect to an XO instance without registering it first

  This is helpful when using multiple instances especially when coupled with shell aliases:

  ```sh
  alias xo-dev='xo-cli --url https://token@dev.company.net'
  alias xo-prod='xo-cli --url https://token@prod.company.net'

  xo-prod vm.start id=e6572e82-983b-4780-a2a7-b19831fb7f45
  ```

- [VM] Yellow icon when VM is busy [#7593](https://github.com/vatesfr/xen-orchestra/issues/7593) (PR [#7680](https://github.com/vatesfr/xen-orchestra/pull/7680))
- [Tasks] Wait a few seconds before estimating remaining time [#7689](https://github.com/vatesfr/xen-orchestra/issues/7689) (PR [#7691](https://github.com/vatesfr/xen-orchestra/pull/7691))
- [Pool/Advanced] Add _Migration Compression_ toggle in the Pool advanced tab. (Only for XCP 8.3) (PR [#7642](https://github.com/vatesfr/xen-orchestra/pull/7642))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Settings/Remotes] Fixed remote encryption not displayed ([PR #7638](https://github.com/vatesfr/xen-orchestra/pull/7638))
- [Backups] Unblock VM migration operations when not properly handled by a previous backup run [Forum#77857](https://xcp-ng.org/forum/post/77857)

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

- @vates/obfuscate minor
- @xen-orchestra/backups patch
- @xen-orchestra/fs patch
- @xen-orchestra/xapi major
- xen-api major
- xo-cli minor
- xo-server minor
- xo-server-backup-reports minor
- xo-web minor

<!--packages-end-->
