## Reverse proxy configuration

You can define multiples proxies in the configuration file

```
[reverseProxies.localhttps]
path = '/https/'
target = 'https://localhost:8080/'
rejectUnauthorized = false

[reverseProxies.localhttp]
path = '/http/'
target = 'http://localhost:8081/'
```

these two proxies will redirect all the queries to `<url of the proxy>/proxy/v1/https/` to `https://localhost:8080/` and `<url of the proxy>/proxy/v1/http/` to `https://localhost:8080/`.

The additionnal options of a proxy's configuraiton's section are used to instantiate the `https` Agent(respectively the `http`) . A notable option is `rejectUnauthorized` which allow to connect to a HTTPS backend  with an invalid/ self signed certificate

The target can have a path ( like `http://target/sub/directory/`),  parameters (`?param=one`) and hash (`#jwt:32154`) that are automatically added to all queries transfered by the proxy.
If a parameter is present in the configuration and in the query, only the config parameter is transferred.

