Just configure your VirtualHost as usual (or your default site), with a section `location` like this one:


```nginx
location /[<path>] {
  proxy_pass http://<XOA ip address>[:<port>]/;

  proxy_http_version 1.1;
  proxy_set_header Connection "upgrade";
  proxy_set_header Upgrade $http_upgrade;

  proxy_redirect default;
}
```

That's all!
