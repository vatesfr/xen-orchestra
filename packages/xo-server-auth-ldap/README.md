<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# xo-server-auth-ldap

> LDAP authentication plugin for XO-Server

## Usage

This plugin allows LDAP users to authenticate to Xen-Orchestra.

The first time a user signs in, XO will create a new XO user with the
same identifier.

Like all other xo-server plugins, it can be configured directly via
the web interface, see [the plugin documentation](https://docs.xen-orchestra.com/architecture#plugins).

If you have issues, you can use the provided CLI to gather more
information:

```
> xo-server-auth-ldap
? uri ldap://ldap.company.net
? fill optional certificateAuthorities? No
? fill optional checkCertificate? No
? fill optional bind? No
? base ou=people,dc=company,dc=net
? fill optional filter? No
configuration saved in ./ldap.cache.conf
? Username john.smith
? Password *****
searching for entries...
0 entries found
could not authenticate john.smith
```

## Failover URIs

If the primary URI is unreachable (firewall drop, host down, TCP reset), XO will retry each configured failover URI in order and use the first one that responds.

> **Note:** all failover servers must share the same credentials and directory structure as the primary. Failover only covers TCP-level failures, authentication errors and search errors are not retried.

## Additional domains (multi-forest)

The `additionalDomains` field lets you connect XO to multiple independent LDAP/AD forests. Each domain has its own URI, base, credentials, and group configuration.

**Authentication flow:** XO tries the primary domain first. If the user is not found there, it falls through to each additional domain in order. If the same username exists in both the primary and an additional domain, the primary always wins and the additional domain's entry is never reached.

**Group sync:** Groups are scoped per domain. Primary-domain groups keep their bare LDAP names for backward compatibility. Additional-domain groups are suffixed with the domain URI to avoid collisions, since the same group name (e.g. `Developers`) can exist in multiple forests.

### Example of group sync in XO between two forests:
**Primary domain   (ldap://corp.net)**
- LDAP group: Developers ->  XO group: Developers
- LDAP group: Admins ->  XO group: Admins

**Additional domain (ldap://acme.net)**:  
- LDAP group: Developers  ->  XO group: Developers (ldap://acme.net)
- LDAP group: Finance     ->  XO group: Finance (ldap://acme.net)
  

> **Note:**
> - A primary-domain group named `Developers` and an additional-domain group named `Developers` are two distinct XO groups with different members. They do not merge.
> - Failover URIs within a domain are for high-availability only, not for cross-forest access. All failover URIs for a domain must replicate the same directory.
> - Removing a domain from the configuration does not delete the XO groups it created. Clean them up manually if needed.

## Algorithm

1. If `bind` is defined, attempt to bind using this user.
2. Searches for the user in the directory starting from the `base`
   with the defined `filter`.
3. If found, a bind is attempted using the distinguished name of this
   user and the provided password.

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

[AGPL-3.0-or-later](https://spdx.org/licenses/AGPL-3.0-or-later) © [Vates SAS](https://vates.fr)
