# xo-server-auth-ldap

> XO-Server LDAP authentication plugin.

To enable this plugin you have to add it into the configuration file
of XO-Server:

```json
{
  "plugins": {
    "auth-ldap": {
      "uri": "ldap://ldap.example.org",
      "base": "ou=people,dc=example,dc=org"
    }
  }
}
```
