# xo-server-auth-saml [![Build Status](https://travis-ci.org/vatesfr/xo-server-auth-saml.png?branch=master)](https://travis-ci.org/vatesfr/xo-server-auth-saml)

**Still in dev: does not work!!!**

> LDAP authentication plugin for XO-Server

This plugin allows SAML users to authenticate to Xen-Orchestra.

The first time a user signs in, XO will create a new XO user with the
same identifier.

## Install

Installation of the [npm package](https://npmjs.org/package/xo-server-auth-saml):

```
> npm install --save xo-server-auth-saml
```

## Usage

To enable this plugin you have to add it into the configuration file
of XO-Server:

```yaml
plugins:

  auth-ldap:
    uri: "ldap://ldap.example.org"

    # Credentials to use before looking for the user record.
    #
    # Default to anonymous.
    bind:

      # Distinguished name of the user permitted to search the LDAP
      # directory for the user to authenticate.
      #
      # For Microsoft Active Directory, it can also be
      # `'<user>@<domain>'`
      dn: 'cn=admin,ou=people,dc=example,dc=org'

      # Password of the user permitted to search the LDAP directory.
      password: 'secret'

    # The base is the part of the directory tree where the users are
    # looked for.
    base: "ou=people,dc=example,dc=org"

    # Filter used to find the user.
    #
    # For Microsoft Active Directory, the filter should be
    # `'(cn={{name}})'` or `'(sAMAccountName={{name}}@<domain>)'`.
    #
    # Default is `'(uid={{name}})'`.
    #filter: '(uid={{name}})'
```

## Development

### Installing dependencies

```
> npm install
```

### Compilation

The sources files are watched and automatically recompiled on changes.

```
> npm run dev
```

### Tests

```
> npm run test-dev
```

## Contributions

Contributions are *very* welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xo-server-auth-saml/issues)
  you've encountered;
- fork and create a pull request.

## License

AGPL3 © [Vates SAS](http://vates.fr)
