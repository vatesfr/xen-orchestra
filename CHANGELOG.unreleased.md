> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

- [Backup/Live mount] The iSCSI target of a mount only accepts connections from the host it is mounted on. **If the hosts reach XO or the proxy through a NAT**, set `iscsi.restrictToHost = false`, or live mounts fail (PR [#10426](https://github.com/vatesfr/xen-orchestra/pull/10426))

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [REST API/VM] Experimental, administrators only: insert an ISO selected in a browser in the CD drive of a VM, without uploading it and without installing anything on the hosts (`POST /vms/{id}/actions/insert_browser_iso` and `/browser-media`). The ISO is ejected once the browser disconnects or stops being read. Enabled by default, `browserMedia.enabled = false` disables it (PR [#10426](https://github.com/vatesfr/xen-orchestra/pull/10426))
- [XO6/VM/Console] Experimental: a CD drive card on the console page inserts an ISO from this computer, without uploading it, while the VM is halted or running. Keep the tab open while the VM reads the ISO: closing it ejects the ISO (PR [#10466](https://github.com/vatesfr/xen-orchestra/pull/10466))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [Backup/Live mount] Fix mounts failing when xo-server runs without root on a system using iptables-legacy, instead of leaving the firewall alone (PR [#10426](https://github.com/vatesfr/xen-orchestra/pull/10426))

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

- @vates/iscsi minor
- @vates/types minor
- @xen-orchestra/backups minor
- @xen-orchestra/mixins minor
- @xen-orchestra/proxy minor
- @xen-orchestra/qa-test patch
- @xen-orchestra/rest-api minor
- @xen-orchestra/web patch
- @xen-orchestra/web-core minor
- xo-server minor
- xo-web minor

<!--packages-end-->
