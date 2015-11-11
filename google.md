# Google

This plugin allows Google users to authenticate to Xen-Orchestra.

The first time a user signs in, XO will create a new XO user with the same identifier, without any permission.


## Creating the Google project

[Create a new project](https://console.developers.google.com/project):

![](create-project.png)
![](create-project-2.png)

Enable the Google+ API:

![](enable-google+-api.png)

Add OAuth 2.0 credentials:

![](add-oauth2-credentials.png)
![](add-oauth2-credentials-2.png)

## Configure the XO plugin



## Debugging

If you can't log in with your Google settings, please check the logs of `xo-server` while you attempt to connect. It will give you hints about the error encountered. You can do that with a `tail -f /var/log/syslog -n 100` on your XOA.

## Missing plugin?

If you don't find the GitHub plugin in the list, be sure to have it displayed in your Xen Orchestra configuration (in `/etc/xo-server/config.yaml`):

```
plugins:

  auth-google:
```

If it's not the case, don't forget to restart the service after your modification, with `systemctl restart xo-server.service`.