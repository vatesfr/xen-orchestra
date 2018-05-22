# GitHub

This plugin allows GitHub users to authenticate to Xen-Orchestra.

The first time a user signs in, XO will create a new XO user with the same identifier, without any permissions.

First you need to configure a new app in your GitHub account:

![](https://raw.githubusercontent.com/vatesfr/xen-orchestra/master/packages/xo-server-auth-github/github.png)

When you get your `clientID` and your `clientSecret`, you can configure them in the GitHub Plugin inside the "Settings/Plugins" view of Xen Orchestra.

Be sure to activate the plugin after you save the configuration (button on top). When it's done, you'll see a link in the login view, this is where you'll go to authenticate:

![](./assets/githubconfig.png)

## Debugging

If you can't log in with your GitHub settings, please check the logs of `xo-server` while you attempt to connect. It will give you hints about the error encountered. You can do that with a `tail -f /var/log/syslog -n 100` on your XOA.
