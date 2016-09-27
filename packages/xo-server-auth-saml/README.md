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

Like all other xo-server plugins, it can be configured directly via
the web iterface, see [the plugin documentation](https://xen-orchestra.com/docs/plugins.html).

> Important: When registering your instance to your identity provider,
> you must configure its callback URL to
> `http://xo.company.net/signin/saml/callback`!

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
