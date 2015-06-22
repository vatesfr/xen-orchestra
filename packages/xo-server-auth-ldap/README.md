# xo-server-auth-ldap [![Build Status](https://travis-ci.org/vatesfr/xo-server-auth-ldap.png?branch=master)](https://travis-ci.org/vatesfr/xo-server-auth-ldap)

> LDAP authentication plugin for XO-Server

This plugin allows LDAP users to authenticate to Xen-Orchestra.

The first time a user signs in, XO will create a new XO user with the
same identifier.

## Install

Installation of the [npm package](https://npmjs.org/package/xo-server-auth-ldap):

```
> npm install xo-server-auth-ldap
```

## Usage

To enable this plugin you have to add it into the configuration file
of XO-Server:

```yaml
plugins:

  auth-ldap:
    uri: "ldap://ldap.example.org"

    # Path to CA certificates to use when connecting to SSL-secured
    # LDAP servers.
    #
    # If not specified, it will use a default set of well-known CAs.
    #certificateAuthorities:
    #  - /path/to/ca_cert.pem
    #  - /path/to/another/ca_cert.pem

    # Check the validity of the server's certificate. Useful when
    # connecting to servers that use a self-signed certificate.
    #
    # Default to true
    #checkCertificate: true

    # Credentials to use before looking for the user record.
    #
    # Default to anonymous.
    bind:

      # Distinguished name of the user permitted to search the LDAP
      # directory for the user to authenticate.
      #
      # For Microsoft Active Directory, it can also be
      # '<user>@<domain>'
      dn: 'cn=admin,ou=people,dc=example,dc=org'

      # Password of the user permitted to search the LDAP directory.
      password: 'secret'

    # The base is the part of the directory tree where the users are
    # looked for.
    base: 'ou=people,dc=example,dc=org'

    # Filter used to find the user.
    #
    # For Microsoft Active Directory, you can try one of the following
    # filters:
    #
    # - '(cn={{name}})'
    # - '(sAMAccountName={{name}})'
    # - '(sAMAccountName={{name}}@<domain>)'
    # - '(userPrincipalName={{name}})'
    #
    # Default is '(uid={{name}})'
    #filter: '(uid={{name}})'
```

## Algorithm

1. If `bind` is defined, attempt to bind using this user.
2. Searches for the user in the directory starting from the `base`
   with the defined `filter`.
3. If found, a bind is attempted using the distinguished name of this
   user and the provided password.

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

- report any [issue](https://github.com/vatesfr/xo-server-auth-ldap/issues)
  you've encountered;
- fork and create a pull request.

## License

AGPL3 © [Vates SAS](http://vates.fr)
