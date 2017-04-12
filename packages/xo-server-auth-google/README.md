# xo-server-auth-google [![Build Status](https://travis-ci.org/vatesfr/xo-server-auth-google.png?branch=master)](https://travis-ci.org/vatesfr/xo-server-auth-google)

> Google authentication plugin for XO-Server

This plugin allows Google users to authenticate to Xen-Orchestra.

The first time a user signs in, XO will create a new XO user with the
same identifier.

## Install

Installation of the [npm package](https://npmjs.org/package/xo-server-auth-google):

```
> npm install --global xo-server-auth-google
```

## Usage

> This plugin is based on [passport-google](https://google.com/jaredhanson/passport-google),
> see [its documentation](https://google.com/jaredhanson/passport-google#configure-strategy)
> for more information about the configuration.

### Creating the Google project

[Create a new project](https://console.developers.google.com/project):

![](create-project.png)
![](create-project-2.png)

Enable the Google+ API:

![](enable-google+-api.png)

Add OAuth 2.0 credentials:

![](add-oauth2-credentials.png)
![](add-oauth2-credentials-2.png)

### Add the plugin to XO-Server config

Like all other xo-server plugins, it can be configured directly via
the web iterface, see [the plugin documentation](https://xen-orchestra.com/docs/plugins.html).

## Development

```
# Install dependencies
> npm install

# Run the tests
> npm test

# Continuously compile
> npm run dev

# Continuously run the tests
> npm run dev-test

# Build for production (automatically called by npm install)
> npm run build
```

## Contributions

Contributions are *very* welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xo-server-auth-google/issues)
  you've encountered;
- fork and create a pull request.

## License

AGPL3 © [Vates SAS](http://vates.fr)
