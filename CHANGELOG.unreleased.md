> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [REST API] Expose `GET /rest/v0/events` to open an SSE connection (PR [#9130](https://github.com/vatesfr/xen-orchestra/pull/9130))
- [REST API] Expose `POST /rest/v0/events/:id/subscriptions` to add a subscription in the SSE connection (PR [#9130](https://github.com/vatesfr/xen-orchestra/pull/9130))
- [REST API] Expose `DELETE /rest/v0/events/:id/subscriptions` to remove a subscription in the SSE connection (PR [#9130](https://github.com/vatesfr/xen-orchestra/pull/9130))
- [Backup] Add warning message: enabling/disabling backup job from VM > Backup affects all VMs in the job (PR [#9155](https://github.com/vatesfr/xen-orchestra/pull/9155))

- **XO 6:**

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

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

- @xen-orchestra/rest-api minor
- xo-collection minor
- xo-web minor

<!--packages-end-->
