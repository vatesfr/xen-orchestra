> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [VM/copy] Only show zstd option when it's supported [#3892](https://github.com/vatesfr/xen-orchestra/issues/3892) (PR [#4326](https://github.com/vatesfr/xen-orchestra/pull/4326))
- [SDN Controller] Use XAPI `tunnel.status` as described [here](https://xapi-project.github.io/xapi/design/tunnelling.html) (PR [#4322](https://github.com/vatesfr/xen-orchestra/pull/4322))
- [Stats] Ability to display last day stats [#4160](https://github.com/vatesfr/xen-orchestra/issues/4160) (PR [#4168](https://github.com/vatesfr/xen-orchestra/pull/4168))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [SDN Controller] Better detect host shutting down to adapt network topology (PR [#4314](https://github.com/vatesfr/xen-orchestra/pull/4314))

### Released packages

> Packages will be released in the order they are here, therefore, they should
> be listed by inverse order of dependency.
>
> Rule of thumb: add packages on top.

- xo-server-sdn-controller v0.1.2
- xo-server v5.47.0
- xo-web v5.47.0
