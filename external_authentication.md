# User authentication

Xen Orchestra support various type of user authentication, internal or even external thanks to the usage of [Passport library](http://passportjs.org/).

## Built-in

This method is the default one. Creating a user is very simple:

1. Go into the Settings view, select "Users"
2. You can create a *user* or an *admin*, with his password (or generate one)

By default, a *user* won't have any permission. At the opposite, an *admin* will have every rights.

## LDAP

XO currently support connection to LDAP directories, like *Open LDAP* or *Active Directory*.

To configure your LDAP, go need to go in the plugin section in "Settings":

![LDAP plugin settings]()

### Filters

LDAP Filters allow you to match properly your user. It's not an easy task to always find the right filter, and it's entirely depending of your LDAP configuration. Still, here is a list of common filters:

* `'(uid={{name}})'` is usually the default filter for *Open LDAP*
* `'(cn={{name}})'`, `'(sAMAccountName={{name}})'`, `'(sAMAccountName={{name}}@<domain>)'` or even `'(userPrincipalName={{name}})'` are widely used for *Active Directory*. Please check with your AD Admin to find the right one.

If you don't find the LDAP plugin in the list, be sure to have it displayed in your Xen Orchestra configuration (in `/etc/xo-server/config.yaml`):

```
plugins:

  auth-ldap:
```

If it's not the case, don't forget to restart the service after your modification, with `systemctl restart xo-server.service`.