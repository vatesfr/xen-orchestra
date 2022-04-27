> This module provides an HTTP and HTTPS proxy for `xo-proxy` and `xo-server`.

- [Set up](#set-up)
- [Usage](#usage)
  - [`xo-proxy`](#xo-proxy)
  - [`xo-server`](#xo-server)

## Set up

The proxy is disabled by default, to enable it, add the following lines to your config:

```toml
[http.proxy]
enabled = true
```

## Usage

For safety reaons, the proxy requires authentication to be used.

### `xo-proxy`

Use the authentication token:

```
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

```
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
