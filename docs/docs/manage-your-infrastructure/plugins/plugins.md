---
sidebar_position: 1
---

# Plugins

Plugins extend Xen Orchestra without touching its core. They live in **Settings → Plugins** of the XO 5 interface:

<UiDetail src="/img/xoa/plugins-menu.png" alt="The Plugins page in Settings" width={520} />

Each plugin can be activated or deactivated, loaded at startup, and configured entirely from the web interface:

<UiDetail src="/img/xoa/plugins-page.png" alt="Configuring a plugin from the web interface" width={520} />

## Plugins to manage your infrastructure

- [IPMI](ipmi-plugin.md): read the IPMI hardware sensors of your hosts, and categorize the ones Xen Orchestra does not recognize.
- [Load balancing](load_balancing.md): place and move your VMs automatically across hosts, depending on their load and on affinity rules.

## Other plugins

Other plugins are documented with the feature they serve:

- [SDN controller](../networking/sdn_controller.md), for private networks and traffic rules,
- [Backup reports](../../backups-and-dr/backup_reports.md), to get notified about your backup jobs,
- [Authentication providers](../../security/user-management/authentication-providers.md), to log in with LDAP, OpenID Connect, SAML, GitHub or Google.
