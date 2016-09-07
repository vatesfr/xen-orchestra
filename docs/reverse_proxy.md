# Reverse proxy

## Apache

As XO-web and XO-server communicates with *WebSockets*, you need to have the `mod_proxy_wstunnel` in Apache (please [check the Apache documentation](http://httpd.apache.org/docs/2.4/mod/mod_proxy_wstunnel.html) about it). It's available for Apache 2.4.5 and later.


Please use this configuration in this order or it will not work:

```apache
ProxyPass /[<path>]/api ws://<xo-server ip>:<xo-server port>/api
ProxyPass /[<path>] http://<xo-server ip>:<xo-server port>/

ProxyPassReverse /[<path>] /
```


## NGINX

Just configure your VirtualHost as usual (or your default site), with a section `location` like this one:


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

  # Issue https://github.com/vatesfr/xo-web/issues/1471
  proxy_read_timeout 1800; # Error will be only every 30m

  # For the VM import feature, this size must be larger than the file we want to upload.
  # Without a proper value, nginx will have error "client intended to send too large body"
  client_max_body_size 4G;
}
```

That's all!
