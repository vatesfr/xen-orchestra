> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [New VM] Ability to set VM max vCPUS [#4703](https://github.com/vatesfr/xen-orchestra/issues/4703) (PR [#4729](https://github.com/vatesfr/xen-orchestra/pull/4729))
- [SDN Controller] Automatically handle new, connected and disconnected servers (PR [#4677](https://github.com/vatesfr/xen-orchestra/pull/4677))
- [Proxy] Support network configuration for the deployed proxy (PR [#4810](https://github.com/vatesfr/xen-orchestra/pull/4810))
- [Menu] Display a warning icon in case of missing patches [#4475](https://github.com/vatesfr/xen-orchestra/issues/4475) (PR [#4683](https://github.com/vatesfr/xen-orchestra/pull/4683))
- [SR/general] Clickable SR usage graph: shows the corresponding disks when you click on one of the sections [#4747](https://github.com/vatesfr/xen-orchestra/issues/4747) (PR [#4754](https://github.com/vatesfr/xen-orchestra/pull/4754))
- [New VM] Ability to copy host BIOS strings [#4204](https://github.com/vatesfr/xen-orchestra/issues/4204) (PR [4755](https://github.com/vatesfr/xen-orchestra/pull/4755))
- [Audit log] Record side effects triggered by users [#4653](https://github.com/vatesfr/xen-orchestra/issues/4653) [#701](https://github.com/vatesfr/xen-orchestra/issues/701) (PR [#4740](https://github.com/vatesfr/xen-orchestra/pull/4740))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Usage Report] Fix wrong report date [#4779](https://github.com/vatesfr/xen-orchestra/issues/4779) (PR [#4799](https://github.com/vatesfr/xen-orchestra/pull/4799))
- [SDN Controller] Fix plugin stuck loading [#4649](https://github.com/vatesfr/xen-orchestra/issues/4649) (PR [#4677](https://github.com/vatesfr/xen-orchestra/pull/4677))
- [xo-server-logs] Fix `Cannot find module '../better-stacks'`

### Released packages

> Packages will be released in the order they are here, therefore, they should
> be listed by inverse order of dependency.
>
> Rule of thumb: add packages on top.

- xo-server-audit v0.1.0
- @xen-orchestra/audit-core v0.1.0
- xo-server-auth-ldap v0.7.0
- xo-server-usage-report v0.7.4
- xo-server-sdn-controller v0.4.0
- xo-server v5.57.0
- xo-web v5.57.0
