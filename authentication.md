# User authentication


Xen Orchestra support various type of user authentication, internal or even external thanks to the usage of [Passport library](http://passportjs.org/).

There is 2 types of XO users:

* admins, with all rights on all connected resources
* users, with no right by default

All users will land on the "flat" view, which display no hierarchy, only all their visible objects (or no object if they are not configured).


ACLs will thus apply only on "users".

**Any account created by an external authentication process (LDAP, SSO...) will be a **user** without any permission.**

Also, you don't have to create an external user by yourself: it will be created automatically in Xen Orchestra after its first connection.