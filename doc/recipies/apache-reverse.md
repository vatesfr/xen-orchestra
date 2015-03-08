# Xen Orchestra behind an Apache reverse proxy

As XO-web and XO-server communicates with *WebSockets*, you need to have the `mod_proxy_tunnel` in Apache (please [check the Apache documentation](http://httpd.apache.org/docs/2.4/mod/mod_proxy_wstunnel.html) about it). It's available for Apache 2.4.5 and later.


Please use this configuration in this order or it will not work:

```
ProxyPass /api/ ws://x.x.x.x/api/
ProxyPassReverse /api/ ws://x.x.x.x/api/

ProxyPass /consoles/ ws://127.0.0.1:8000/consoles/
ProxyPassReverse /consoles/ ws://127.0.0.1:8000/consoles/

ProxyPass / http://x.x.x.x/
ProxyPassReverse / http://x.x.x.x/
```
