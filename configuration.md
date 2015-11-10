# Configuration

Once Xen Orchestra is installed, you can configure some parameters in the configuration file. Let's see how to do that.

## Configuration

The configuration file is in the XO-server folder (for XOA users, it's in `/etc/xo-server/config.yaml`). If it's not already done, copy this file to `local.yaml` in the same folder. Now, you can edit the configuration safely (if you destroy it, you can reuse the dist file).

**WARNING: YAML is very strict with indentation: use spaces, not tabs.**

### User to run XO-server as

By default, XO-server is running with 'nobody' user and 'nogroup' group. You can change that by uncommenting these lines and choose whatever user/group you want:

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

XO-server can also run in HTTPS (both HTTP and HTTPS can cohabit) - just modify what's needed in the `# Basic HTTPS` section, this time with certificates/keys you want and their path:

```yaml
host: '0.0.0.0'
port: 443
certificate: './certificate.pem'
key: './key.pem'
```

> If a chain of certificates authorities is needed, you may bundle them directly in the certificate. Note: the order of certificates does matter, your certificate should come first followed by the certificate of the above certificate authority up to the root.

### Link to XO-web

On XOA, you shouldn't have to change this. On a manual install, you need to link files served by XO-server for XO-web. That's the mount section. In this example, "xo-web" folder is in the same folder than "xo-server":

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

### External auth (LDAP)

You should see at the end of the config file, something like this:

```
plugins:

  auth-ldap:
  auth-github:
```

The plugin configuration is now done in the interface, in the plugin section of "Settings".

### Log file

On XOA, the log file for XO-server is in `/var/log/syslog`. It contains all the server information returned and can be a real help when you have trouble.