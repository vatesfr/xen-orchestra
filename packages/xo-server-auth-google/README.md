<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# xo-server-auth-google

> Google authentication plugin for XO-Server

## Usage

This plugin allows Google users to authenticate to Xen-Orchestra.

The first time a user signs in, XO will create a new XO user with the
same identifier.

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

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

[AGPL-3.0-or-later](https://spdx.org/licenses/AGPL-3.0-or-later) © [Vates SAS](https://vates.fr)
