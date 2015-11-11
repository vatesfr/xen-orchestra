# User authentication

Xen Orchestra support various type of user authentication, internal or even external thanks to the usage of [Passport library](http://passportjs.org/).

There is 2 types of XO users:

* admins, with all rights on all connected resources
* users, with no right by default

All users will land on the "flat" view, which display no hierarchy, only all their visible objects (or no object if they are not configured).


ACLs will thus apply only on "users".

**Any account created by an external authentication process (LDAP, SSO...) will be a **user** without any permission.**

Also, you don't have to create an external user by yourself: it will be created automatically in Xen Orchestra after its first connection.


## Built-in

This method is the default one. Creating a user is very simple:

1. Go into the Settings view, select "Users"
2. You can create a *user* or an *admin*, with his password (or generate one)

By default, a *user* won't have any permission. At the opposite, an *admin* will have every rights.

## LDAP


## GitHub

You can use your GitHub account to connect into Xen Orchestra.

First you need to configure a new app in your GitHub account:

![](https://github.com/vatesfr/xo-server-auth-github/blob/master/github.png)