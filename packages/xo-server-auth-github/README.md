# xo-server-auth-github [![Build Status](https://travis-ci.org/vatesfr/xo-server-auth-github.png?branch=master)](https://travis-ci.org/vatesfr/xo-server-auth-github)

> GitHub authentication plugin for XO-Server

This plugin allows GitHub users to authenticate to Xen-Orchestra.

The first time a user signs in, XO will create a new XO user with the
same identifier.

## Install

Installation of the [npm package](https://npmjs.org/package/xo-server-auth-github):

```
> npm install --global xo-server-auth-github
```

## Usage

> This plugin is based on [passport-github](https://github.com/jaredhanson/passport-github),
> see [its documentation](https://github.com/jaredhanson/passport-github#configure-strategy)
> for more information about the configuration.

![Registering XO instance in GitHub](github.png)

To enable this plugin you have to add it into the configuration file
of XO-Server:

```yaml
plugins:

  auth-github:

    # Both these values will be given to you when your instance of XO
    # is registered in GitHub
    # (https://github.com/settings/developers).
    clientID: c2f2f881062f170e2ec3
    clientSecret: 4335e70f62e2dbb7917df0126b1015b5617bceea
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

- report any [issue](https://github.com/vatesfr/xo-server-auth-github/issues)
  you've encountered;
- fork and create a pull request.

## License

AGPL3 © [Vates SAS](http://vates.fr)
