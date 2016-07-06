# SAML

> SAML authentication plugin for XO-Server

This plugin allows SAML users to authenticate to Xen-Orchestra.

The first time a user signs in, XO will create a new XO user with the same identifier.

## Configuration

In the "Settings" then "Plugins" view, expand the SAML plugin configuration. Then provide the needed fields:

![](./assets/samlconfig.png)

Save the configuration and then activate the plugin (button on top).

> Important: When registering your instance to your identity provider,
> you must configure its callback URL to
> `http://xo.example.net/signin/saml/callback`!

## Debugging

If you can't log in with your SAML settings, please check the logs of `xo-server` while you attempt to connect. It will give you hints about the error encountered. You can do that with a `tail -f /var/log/syslog -n 100` on your XOA.
