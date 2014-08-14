# Administration

Once Xen Orchestra is installed, you can configure some parameters in the configuration file. Let's see how to do that.

## Configuration

The configuration file is in XO-server folder (for XOA users, it's in `/root/xo-server/config/local.yaml.dist`). If it's not already done, copy this file to `local.yaml` in the same folder. Now, you can edit the configuration safely (if you destroy it, you can reuse the dist file).

WARNING: YAML is very strict with indentation: use spaces for it, not tabs.

### User to run XO-server as

By default, XO-server is running with 'nobody' user and 'nogroup' group. You can change it by uncommenting these lines and choose whatever user/group you want:

```yaml
user: 'nobody'
group: 'nogroup'
```

### HTTP listen address and port

By default, XO-server listens to all addresses (0.0.0.0) and runs on port 80. You can change this if you want in the `# Basic HTTP` section:

```yaml
host: '0.0.0.0'
port: 80
```

### HTTPS

XO-server can also run in HTTPS (both HTTP and HTTPS can cohabit), just modify what's needed in the `# Basic HTTPS` section, this time with certificates/keys you want and their path:

```yaml
host: '0.0.0.0'
port: 443
certificate: './certificate.pem'
key: './key.pem'
```

### Link to XO-web

On XOA, you shouldn't have to change this. On manual install, you need to link files served by XO-server for XO-web. That's the mount section. In this example, "xo-web" folder is in the same folder than "xo-server":

```yaml
  mounts:
    '/':
      - '../xo-web/dist/'
```

### Redis server

By default, XO-server will try to contact Redis server on `localhost`, with the port `6379`. But you can define anything else you want:

```yaml
  uri: 'tcp://db:password@hostname:port'
```

### Log file

On XOA, the log file for XO-server is in `/var/log/xo`: it has all of the server informations. Can be a real help when you have trouble.

## First connection

### Login screen

This is the login screen:

![](./assets/loginok.png)

Note the green *check* icons: it indicates that you are correctly connected to XO-server. If you see this icon: ![](./assets/loginbad.png), that's not good. Please check the Troubleshooting section if it's the case.

The default user login/password is `admin@admin.net` with `admin` password. This is what you should see after been logged:

![](./assets/welcome.png)

 You should change your password now.

## Users and passwords

You can access users ans servers management in the Setting view. It's accessible from the main menu:

![](./assets/gosettings.png)

From there, you can modify your current password, then Save:

![](./assets/users.png)

You can add new users with limited rights. So far, **read** permission allow to see everything but not to interact with any objects. It's pretty basic for now, but [check how it will evolve soon](https://xen-orchestra.com/users-roles-in-xen-orchestra/) on our website.

## Add Xen hosts

Adding Xen hosts is in the same view (Settings) as users:

![](./assets/servers.png)

When you add a server, you just have to wait to be displayed (e.g: in the main view. Removing is less trivial, you need to restart XO-server (or it will not disappear).




**Congrats! You've reached the end of this doc. See the next part, [about how the interface works](../layout/README.md).**
