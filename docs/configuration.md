# Configuration

Once Xen Orchestra is installed, you can configure some parameters in the configuration file. Let's see how to do that.

:::tip
The configuration file is located at `/etc/xo-server/config.toml`.
:::

If you need to do any configuration on the system itself (firewall, SSH…), check the [XOA dedicated section](xoa.md).

## User to run XO-server as

By default, XO-server runs as 'root'. You can change that by uncommenting these lines and choose whatever user/group you want:

```toml
user = 'nobody'
group = 'nogroup'
```

**Warning!** A non-privileged user requires the use of `sudo` to mount NFS shares. See [installation from the sources](installation.md#from-the-sources).

## HTTP listen address and port

By default, XO-server listens on all addresses (0.0.0.0) and runs on port 80. If you need to, you can change this in the `# Basic HTTP` section:

```toml
hostname = '0.0.0.0'
port = 80
```

## HTTPS and certificates

XO-server can also run in HTTPS (you can run HTTP and HTTPS at the same time) - just modify what's needed in the `# Basic HTTPS` section, this time with the certificates/keys you need and their path:

```toml
hostname = '0.0.0.0'
port = 443
certificate = './certificate.pem'
key = './key.pem'
```

:::tip
If a chain of certificates authorities is needed, you may bundle them directly in the certificate. Note: the order of certificates does matter, your certificate should come first followed by the certificate of the above certificate authority up to the root.
:::

### HTTPS redirection

If you want to redirect everything to HTTPS, you can modify the configuration like this:

```toml
# If set to true, all HTTP traffic will be redirected to the first HTTPs configuration.

redirectToHttps = true
```

This should be written just before the `mount` option, inside the `http:` block.

## Link to xo-web

You shouldn't have to change this. It's the path where `xo-web` files are served by `xo-server`.

```toml
[http.mounts]
'/' = '../xo-web/dist/'
```

## Custom certificate authority

If you use certificates signed by an in-house CA for your XCP-ng or XenServer hosts, and want to have Xen Orchestra connect to them without rejection, you can use the [`NODE_EXTRA_CA_CERTS`](https://nodejs.org/api/cli.html#cli_node_extra_ca_certs_file) environment variable.

To enable this option in your XOA, create `/etc/systemd/system/xo-server.service.d/ca.conf` with the following content:

```
[Service]
Environment=NODE_EXTRA_CA_CERTS=/usr/local/share/ca-certificates/my-cert.crt
```

Don't forget to reload `systemd` conf and restart `xo-server`:

```
# systemctl daemon-reload
# systemctl restart xo-server.service
```

> For XO Proxy, the process is almost the same except the file to create is `/etc/systemd/system/xo-proxy.service.d/ca.conf` and the service to restart is `xo-proxy.service`.

## Redis server

By default, XO-server will try to contact Redis server on `localhost`, with the port `6379`. But you can define whatever you want:

```toml
uri = 'tcp://db:password@hostname:port'
```

## Proxy for updates and patches

To check if your hosts are up-to-date, we need to access `http://updates.xensource.com/XenServer/updates.xml`.

And to download the patches, we need access to `http://support.citrix.com/supportkc/filedownload?`.

To do that behind a corporate proxy, just add the `httpProxy` variable to match your current proxy configuration.

You can add this at the end of your config file:

```toml
# HTTP proxy configuration used by xo-server to fetch resources on the Internet.
#
# See: https://github.com/TooTallNate/node-proxy-agent#maps-proxy-protocols-to-httpagent-implementations

httpProxy = 'http://username:password@proxyAddress:port'
```

## Log file

On XOA, the log file for XO-server is in `/var/log/syslog`. It contains all the server information returned and can be a real help when you have trouble.

## Reverse proxy

If you don't want to have Xen Orchestra exposed directly outside, or just integrating it with your existing infrastructure, you can use a Reverse Proxy.

### Apache

As `xo-web` and `xo-server` communicate with _WebSockets_, you need to have the [`mod_proxy`](http://httpd.apache.org/docs/2.4/mod/mod_proxy.html), [`mod_proxy_http`](http://httpd.apache.org/docs/2.4/mod/mod_proxy_http.html), [`mod_proxy_wstunnel`](http://httpd.apache.org/docs/2.4/mod/mod_proxy_wstunnel.html) and [`mod_rewrite`](http://httpd.apache.org/docs/2.4/mod/mod_rewrite.html) modules enabled.

Please use this configuration in this order or it will not work. Do not forget the trailing slashes:

```apacheconf
RewriteEngine On
RewriteCond %{HTTP:upgrade} websocket [NC]
RewriteRule /[<path>]/(.*) ws://<xo-server ip>:<xo-server port>/$1 [L,P]

ProxyPass /[<path>]/ http://<xo-server ip>:<xo-server port>/
ProxyPassReverse /[<path>]/ http://<xo-server ip>:<xo-server port>/
```

### NGINX

Just configure your VirtualHost as usual (or your default site), with a `location` section like this one:

```nginx
location /[<path>] {
  # Add some headers
  proxy_set_header        Host $host;
  proxy_set_header        X-Real-IP $remote_addr;
  proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header        X-Forwarded-Proto $scheme;

  # Proxy configuration
  proxy_pass http://<XOA ip address>[:<port>]/;

  proxy_http_version 1.1;
  proxy_set_header Connection "upgrade";
  proxy_set_header Upgrade $http_upgrade;

  proxy_redirect default;

  # Issue https://github.com/vatesfr/xen-orchestra/issues/1471
  proxy_read_timeout 1800; # Error will be only every 30m

  # For the VM import feature, this size must be larger than the file we want to upload.
  # Without a proper value, nginx will have error "client intended to send too large body"
  client_max_body_size 4G;
}
```

That's all!
