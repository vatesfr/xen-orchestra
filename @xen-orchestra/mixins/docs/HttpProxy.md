> This module provides an HTTP and HTTPS proxy for `xo-proxy` and `xo-server`.

- [Set up](#set-up)
- [Usage](#usage)
  - [`xo-proxy`](#xo-proxy)
  - [`xo-server`](#xo-server)
- [Use cases](#use-cases)
  - [Access hosts in a private network](#access-hosts-in-a-private-network)
  - [Allow upgrading xo-proxy via xo-server](#allow-upgrading-xo-proxy-via-xo-server)

## Set up

The proxy is enabled by default, to disable it, add the following lines to your config:

```toml
[http.proxy]
enabled = false
```

## Usage

For safety reasons, the proxy requires authentication to be used.

### `xo-proxy`

Use the authentication token:

```console
$ cat ~/.config/xo-proxy/config.z-auto.json
{"authenticationToken":"J0BgKritQgPxoyZrBJ5ViafQfLk06YoyFwC3fmfO5wU"}
```

Proxy URL to use:

```
https://J0BgKritQgPxoyZrBJ5ViafQfLk06YoyFwC3fmfO5wU@xo-proxy.company.lan
```

### `xo-server`

> Only available for admin users.

You can use your credentials:

```
https://user:password@xo.company.lan
```

Or create a dedicated token with `xo-cli`:

```console
$ xo-cli --createToken xoa.company.lan admin@admin.net
Password: ********
Successfully logged with admin@admin.net
Authentication token created

DiYBFavJwf9GODZqQJs23eAx9eh3KlsRhBi8RcoX0KM
```

And use it in the URL:

```
https://DiYBFavJwf9GODZqQJs23eAx9eh3KlsRhBi8RcoX0KM@xo.company.lan
```

## Use cases

### Access hosts in a private network

To access hosts in a private network, deploy an XO Proxy in this network, expose its port 443 and use it as an HTTP proxy to connect to your servers in XO.

### Allow upgrading xo-proxy via xo-server

If your xo-proxy does not have direct Internet access, you can use xo-server as an HTTP proxy to make upgrades possible.
