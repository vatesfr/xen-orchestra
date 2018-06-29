# User authentication


Xen Orchestra supports various types of user authentication, internal or even external thanks to the usage of the [Passport library](http://passportjs.org/).

There are 2 types of XO users:

* admins, with all rights on all connected resources
* users, with no rights by default

All users will land on the "flat" view, which displays no hierarchy, only all their visible objects (or no object if they are not configured).


ACLs will thus apply only to "users".

> Any account created by an external authentication process (LDAP, SSO...) will be a **user** without any permission.

Also, you don't have to create an external user by yourself: it will be created automatically in Xen Orchestra after its first connection.

## Debugging

If you can't log in with your LDAP/SAML/Github/Google settings, please check the logs of `xo-server` while you attempt to connect. It will give you hints about the error encountered. You can do that with a `tail -f /var/log/syslog -n 100` on your XOA.
