Just configure your VirtualHost as usual (or your default site), with a section `location` like this one:


```

        location / {
                proxy_pass http://<XOA_IP_ADDRESS[:port]>/;
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection "upgrade";
        }
```

That's all!
