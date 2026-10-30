> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [SDN Controller] Fix the direct OpenFlow channel failing against a bridge that also allows newer OpenFlow versions (`Unsupported OpenFlow version: 5`): the version is negotiated down to OpenFlow 1.1 as the OpenFlow specification requires
- [SDN Controller] Taking control of a bridge no longer restricts it to OpenFlow 1.1, which broke the VIF locking flows XAPI installs with OpenFlow 1.0 (PR [#10691](https://github.com/vatesfr/xen-orchestra/pull/10691))

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

- @xen-orchestra/openflow minor
- @xen-orchestra/web-core minor
- xo-server-sdn-controller patch

<!--packages-end-->
