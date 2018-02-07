# Google

This plugin allows Google users to authenticate to Xen-Orchestra.

The first time a user signs in, XO will create a new XO user with the same identifier, without any permission.


## Creating the Google project

[Create a new project](https://console.developers.google.com/project):

![](https://raw.githubusercontent.com/vatesfr/xen-orchestra/master/packages/xo-server-auth-google/create-project-2.png)

Enable the Google+ API:

![](https://raw.githubusercontent.com/vatesfr/xen-orchestra/master/packages/xo-server-auth-google/enable-google+-api.png)

Add OAuth 2.0 credentials:

![](https://raw.githubusercontent.com/vatesfr/xen-orchestra/master/packages/xo-server-auth-google/add-oauth2-credentials.png)
![](https://raw.githubusercontent.com/vatesfr/xen-orchestra/master/packages/xo-server-auth-google/add-oauth2-credentials-2.png)

## Configure the XO plugin

In Settings, then Plugins, expand the Google plugin detail and provide:

* a `clientID` e.g `326211154583-nt2s112d3t7f4f1hh49oo9164nivvbnu.apps.googleusercontent.com`
* a `clientSecret`, e.g `HTDb8I4jXiLRMaRL15qCffQ`
* the `callbackURL`, e.g `http://xo.company.net/signin/google/callback`

![](./assets/googleconfig.png)

Be sure to activate the plugin after you save the configuration (button on top).

You can now connect with your Google account in the log in page:

![Google log in]()

## Debugging

If you can't log in with your Google settings, please check the logs of `xo-server` while you attempt to connect. It will give you hints about the error encountered. You can do that with a `tail -f /var/log/syslog -n 100` on your XOA.
