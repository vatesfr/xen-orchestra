This plugin allows LDAP users to authenticate to Xen-Orchestra.

The first time a user signs in, XO will create a new XO user with the
same identifier.

Like all other xo-server plugins, it can be configured directly via
the web interface, see [the plugin documentation](https://xen-orchestra.com/docs/plugins.html).

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

## Algorithm

1. If `bind` is defined, attempt to bind using this user.
2. Searches for the user in the directory starting from the `base`
   with the defined `filter`.
3. If found, a bind is attempted using the distinguished name of this
   user and the provided password.
