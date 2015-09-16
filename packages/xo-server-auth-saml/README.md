# xo-server-auth-saml [![Build Status](https://travis-ci.org/vatesfr/xo-server-auth-saml.png?branch=master)](https://travis-ci.org/vatesfr/xo-server-auth-saml)

> SAML authentication plugin for XO-Server

This plugin allows SAML users to authenticate to Xen-Orchestra.

The first time a user signs in, XO will create a new XO user with the
same identifier.

## Install

Installation of the [npm package](https://npmjs.org/package/xo-server-auth-saml):

```
> npm install --global xo-server-auth-saml
```

## Usage

> This plugin is based on [passport-saml](https://github.com/bergie/passport-saml),
> see [its documentation](https://github.com/bergie/passport-saml#configure-strategy)
> for more information about the configuration.

To enable this plugin you have to add it into the configuration file
of XO-Server:

```yaml
plugins:

  auth-saml:
      path: '/signin/saml/callback'

      # Server certificate used to validate in Base64 (no comments, no line breaks).
      cert: 'MIIFBjCCAu4CCQDBMhqko5KQODANBgkqhkiG9w0BAQ ...'

      # Identity provider entry point (sign in URL).
      entryPoint: 'https://saml.example.org/signin/'

      # Issuer string to supply the identity provider.
      issuer: 'xen-orchestra'

      # Field to use as the name of the user.
      #
      # Default: uid.
      usernameField: 'uid'
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
