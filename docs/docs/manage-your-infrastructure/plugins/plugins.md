---
sidebar_position: 1
---

# Plugins

Plugins extend Xen Orchestra without touching its core. Each one can be activated or deactivated, loaded at startup, and configured entirely from the web interface:

- in XO 6, from **Administration → Settings → Plugins**,
- in XO 5, from **Settings → Plugins**.

The screenshots below show the XO 5 interface:

<UiDetail src="/img/xoa/plugins-menu.png" alt="The Plugins page in the XO 5 settings" width={520} />

<UiDetail src="/img/xoa/plugins-page.png" alt="Configuring a plugin from the XO 5 web interface" width={520} />

## Plugins to manage your infrastructure

- [IPMI](ipmi-plugin.md): read the IPMI hardware sensors of your hosts, and categorize the ones Xen Orchestra does not recognize.
- [Load balancing](load_balancing.md): place and move your VMs automatically across hosts, depending on their load and on affinity rules.

## Other plugins

Other plugins are documented with the feature they serve:

- [Audit log](../../security/user-management/users.md#audit-log), to record the actions performed by users,
- [Authentication providers](../../security/user-management/authentication-providers.md), to log in with LDAP, OpenID Connect, SAML, GitHub or Google,
- [Backup reports](../../backups-and-dr/backup_reports.md), to get notified about your backup jobs,
- [Netbox](../advanced.md#netbox), to synchronize your infrastructure with Netbox,
- [Performance alerts](../advanced.md#performance-alerts), to be warned when a resource crosses a usage threshold,
- [SDN controller](../networking/sdn_controller.md), for private networks and traffic rules,
- [Usage reports](../manage_infrastructure.md#usage-reports), to receive regular reports on the usage of your resources,
- [Web hooks](../advanced.md#web-hooks), to call your own services when Xen Orchestra events happen.
