> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Backup/Encryption] Use `aes-256-gcm` instead of `aes-256-ccm` to mitigate [padding oracle attacks](https://en.wikipedia.org/wiki/Padding_oracle_attack) (PR [#6447](https://github.com/vatesfr/xen-orchestra/pull/6447))
- [Settings/Remote] Display `lock` icon for encrypted remote and a warning if the remote uses a legacy encryption algorithm (PR [#6465](https://github.com/vatesfr/xen-orchestra/pull/6465))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- Really enable by default the embedded HTTP/HTTPS proxy

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

- @vates/nbd-client major
- @vates/otp major
- @vates/predicates minor
- @vates/read-chunk patch
- @xen-orchestra/backups patch
- @xen-orchestra/fs minor
- @xen-orchestra/log minor
- vhd-cli patch
- vhd-lib patch
- xo-remote-parser patch
- xo-server minor
- xo-server-transport-nagios patch
- xo-web minor

<!--packages-end-->
