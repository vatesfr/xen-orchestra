> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

- [XO 5] Update sanitize-html dependency (Dependabot alert [484](https://github.com/vatesfr/xen-orchestra/security/dependabot/484)) (PR [#9851](https://github.com/vatesfr/xen-orchestra/pull/9851))
- [MCP] Global kill-switch — set `[mcp] enabled = false` in `xo-server` config to immediately reject every MCP client connection

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [Backups] Add UserAgent in s3 client (PR [#9815](https://github.com/vatesfr/xen-orchestra/pull/9815))
- [xo-web] support qcow2 format in disk > import (PR [#9817](https://github.com/vatesfr/xen-orchestra/pull/9817))
- [xo-server] support qcow2 format in `disk.importContent` and `disk.import` jsonRPC api (PR [#9817](https://github.com/vatesfr/xen-orchestra/pull/9817))
- [web-core] Update `UiTag` and parse tag for detecting tags with `=` (PR [#9811](https://github.com/vatesfr/xen-orchestra/pull/9811))
- [Encryption] Implement encryption and decryption feature for redis (PR [#9735](https://github.com/vatesfr/xen-orchestra/pull/9735))
- [REST API] Add `vms/:id/actions/revert_snapshot` REST route (PR [#9788](https://github.com/vatesfr/xen-orchestra/pull/9788))
- **XO 5**:
  - [Export config] Hide passphrase by default (PR [#9824](https://github.com/vatesfr/xen-orchestra/pull/9824))
- [Backups] Refactor clean phase for incremental and full backups ([#9765](https://github.com/vatesfr/xen-orchestra/pull/9765))
- [REST API] Expose `DELETE /rest/v0/srs/:id` (PR [#9464](https://github.com/vatesfr/xen-orchestra/pull/9464))
- [MCP] Read `HTTP_PROXY`/`HTTPS_PROXY`/`NO_PROXY` so an internal XOA stays reachable when the AI assistant goes through a corporate proxy (PR [#9820](https://github.com/vatesfr/xen-orchestra/pull/9820))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [REST] Fixed ignored parameters in request body due to a tsoa bug (see https://github.com/lukeautry/tsoa/pull/1858) (PR [#9793](https://github.com/vatesfr/xen-orchestra/pull/9793))
- [Tasks] Fixed issue with task without result and backup runs on task size (PR [#9841](https://github.com/vatesfr/xen-orchestra/pull/9841))
- **XO 5**:
  - [Job] Error while using vm.set with `cpuMask` in job view (PR [#9823](https://github.com/vatesfr/xen-orchestra/pull/9823))

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
- @xen-orchestra/acl minor
- @xen-orchestra/backup-archive major
- @xen-orchestra/backups minor
- @xen-orchestra/backups-cli patch
- @xen-orchestra/disk-cli minor
- @xen-orchestra/disk-transform minor
- @xen-orchestra/fs minor
- @xen-orchestra/mcp minor
- @xen-orchestra/rest-api minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- @xen-orchestra/xapi minor
- xo-server minor
- xo-web minor

<!--packages-end-->
