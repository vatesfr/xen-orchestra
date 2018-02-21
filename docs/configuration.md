# Configuration

Once Xen Orchestra is installed, you can configure some parameters in the configuration file. Let's see how to do that.

## Configuration

The configuration file is in `/etc/xo-server/config.yaml`.

**WARNING: YAML is very strict with indentation: use spaces, not tabs.**

### User to run XO-server as

By default, XO-server is running as 'root'. You can change that by uncommenting these lines and choose whatever user/group you want:

```yaml
user: 'nobody'
group: 'nogroup'
```

**Warning!** A non-privileged user:

* can't bind to a port < 1024
* can't mount NFS shares

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

#### HTTPS redirection

If you want to redirect everything to HTTPS, you can modify the configuration like this:

```
# If set to true, all HTTP traffic will be redirected to the first HTTPs configuration.

  redirectToHttps: true
```

This should be written just before the `mount` option, inside the `http:` block.

### Link to XO-web

You shouldn't have to change this. It's the path were "xo-web" files are served by "xo-server.

```yaml
  mounts:
    '/':
      - '../xo-web/dist/'
```

### Custom certificate authority

If you want to use certificates signed by an in-house CA for your XenServer hosts, and have Xen Orchestra connecting to it without rejecting them, you need to add `--use-openssl-ca` option in Node, but also add this CA to your trust store (`/etc/ssl/certs` via `update-ca-certificates` in your XOA).

To enable this option in your XOA, edit the `/etc/systemd/system/xo-server.service` file and add this:

```
Environment=NODE_OPTIONS=--use-openssl-ca
```

Don't forget to reload `systemd` conf and restart `xo-server`:

```
# systemctl daemon-reload
# systemctl restart xo-server.service
```

### Redis server

By default, XO-server will try to contact Redis server on `localhost`, with the port `6379`. But you can define anything else you want:

```yaml
  uri: 'tcp://db:password@hostname:port'
```

### Proxy for XenServer updates and patches

To check if your hosts are up-to-date, we need to access `http://updates.xensource.com/XenServer/updates.xml`.

And to download the patches, access to `http://support.citrix.com/supportkc/filedownload?`.

To do that behind a corporate proxy, just add the `httpProxy` variable to fit in your current proxy configuration.

You can add this at the end of your config file:

```yaml
# HTTP proxy configuration used by xo-server to fetch resources on the Internet.
#
# See: https://github.com/TooTallNate/node-proxy-agent#maps-proxy-protocols-to-httpagent-implementations

httpProxy: 'http://username:password@proxyAddress:port'
```

### Log file

On XOA, the log file for XO-server is in `/var/log/syslog`. It contains all the server information returned and can be a real help when you have trouble.
