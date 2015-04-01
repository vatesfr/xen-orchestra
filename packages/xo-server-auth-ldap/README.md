# xo-server-auth-ldap [![Build Status](https://travis-ci.org/vatesfr/xo-server-auth-ldap.png?branch=master)](https://travis-ci.org/vatesfr/xo-server-auth-ldap)

> LDAP authentication plugin for XO-Server

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
    uri: "ldap://ldap.example.org",
    base: "ou=people,dc=example,dc=org"
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

- report any [issue](https://github.com/vatesfr/xo-server-auth-ldap/issues)
  you've encountered;
- fork and create a pull request.

## License

AGPL3 © [Vates SAS](http://vates.fr)
