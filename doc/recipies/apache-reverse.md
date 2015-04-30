# Xen Orchestra behind an Apache reverse proxy

As XO-web and XO-server communicates with *WebSockets*, you need to have the `mod_proxy_tunnel` in Apache (please [check the Apache documentation](http://httpd.apache.org/docs/2.4/mod/mod_proxy_wstunnel.html) about it). It's available for Apache 2.4.5 and later.


Please use this configuration in this order or it will not work:

```
ProxyPass /api/ ws://<xo-server ip>:<xo-server port>/api/
ProxyPassReverse /api/ ws://<xo-server ip>:<xo-server port>/api/

ProxyPass /consoles/ ws://<xo-server ip>:<xo-server port>/consoles/
ProxyPassReverse /consoles/ ws://<xo-server ip>:<xo-server port>/consoles/

ProxyPass / http://<xo-server ip>:<xo-server port>/
ProxyPassReverse / http://<xo-server ip>:<xo-server port>/
```
