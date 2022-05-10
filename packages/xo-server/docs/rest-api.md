# REST API <!-- omit in toc -->

- [Authentication](#authentication)
- [Collections](#collections)
- [VM Export](#vm-export)
- [VDI Export](#vdi-export)
- [The future](#the-future)

> This [REST](https://en.wikipedia.org/wiki/Representational_state_transfer)-oriented API is experimental. Non-backward compatible changes or removal may occur in any future release. Use of the feature is not recommended in production environments.

## Authentication

A valid authentication token should be attached as a cookie to all HTTP
requests:

```http
GET /rest/v0 HTTP/1.1
Cookie: authenticationToken=TN2YBOMYtXB_hHtf4wTzm9p5tTuqq2i15yeuhcz2xXM
```

The server will respond to an invalid token with a `401 Unauthorized` status.

The server can request that the client updates its token with a `Set-Cookie` header:

```http
HTTP/1.1 200 OK
Set-Cookie: authenticationToken=KQxQdm2vMiv7jBIK0hgkmgxKzemd8wSJ7ugFGKFkTbs
```

Usage with cURL:

```bash
curl -b \
  authenticationToken=KQxQdm2vMiv7jBIK0hgkmgxKzemd8wSJ7ugFGKFkTbs \
  https://xo.company.lan/rest/v0/
```

You can use `xo-cli` to create an authentication token:

```bash
$ xo-cli --createToken xoa.company.lan admin@admin.net
Password: ********
Successfully logged with admin@admin.net
Authentication token created

DiYBFavJwf9GODZqQJs23eAx9eh3KlsRhBi8RcoX0KM
```

> Only admin users can currently use the API.

## Collections

Collections of objects are available at `/<name>` (e.g. `/vms`)

The following query parameters are supported:

- `limit`: max number of objects returned
- `fields`: if specified, instead of plain URLs, the results will be objects containing the requested fields
- `filter`: a string that will be used to select only matching objects, see [the syntax documentation](https://xen-orchestra.com/docs/manage_infrastructure.html#live-filter-search)
- `ndjson`: if specified, the result will be in [NDJSON format](http://ndjson.org/)

Simple request:

```http
GET /rest/v0/vms HTTP/1.1
Cookie: authenticationToken=TN2YBOMYtXB_hHtf4wTzm9p5tTuqq2i15yeuhcz2xXM

HTTP/1.1 200 OK
Content-Type: application/json

[
  "/rest/v0/vms/770aa52a-fd42-8faf-f167-8c5c4a237cac",
  "/rest/v0/vms/5019156b-f40d-bc57-835b-4a259b177be1"
]
```

With custom fields:

```
GET /rest/v0/vms?fields=name_label,power_state HTTP/1.1
Cookie: authenticationToken=TN2YBOMYtXB_hHtf4wTzm9p5tTuqq2i15yeuhcz2xXM

HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "name_label": "Debian 10 Cloudinit",
    "power_state": "Running",
    "url": "/rest/v0/vms/770aa52a-fd42-8faf-f167-8c5c4a237cac"
  },
  {
    "name_label": "Debian 10 Cloudinit self-service",
    "power_state": "Halted",
    "url": "/rest/v0/vms/5019156b-f40d-bc57-835b-4a259b177be1"
  }
]
```

As NDJSON:

```http
GET /rest/v0/vms?fields=name_label,power_state&ndjson HTTP/1.1
Cookie: authenticationToken=TN2YBOMYtXB_hHtf4wTzm9p5tTuqq2i15yeuhcz2xXM

HTTP/1.1 200 OK
Content-Type: application/x-ndjson

{"name_label":"Debian 10 Cloudinit","power_state":"Running","url":"/rest/v0/vms/770aa52a-fd42-8faf-f167-8c5c4a237cac"}
{"name_label":"Debian 10 Cloudinit self-service","power_state":"Halted","url":"/rest/v0/vms/5019156b-f40d-bc57-835b-4a259b177be1"}
```

## VM Export

A VM can be exported as an XVA at `/rest/v0/vms/<uuid>.xva`.

By default, the XVA is not compressed, however the `compress` query parameter supports the following values:

- `gzip`: use [gzip](https://en.wikipedia.org/wiki/Gzip) compression (very slow)
- `zstd`: use [Zstandard](https://en.wikipedia.org/wiki/Zstd) compression (fast, only supported on XCP-ng)

```bash
curl \
  -b authenticationToken=KQxQdm2vMiv7jBIK0hgkmgxKzemd8wSJ7ugFGKFkTbs \
  'https://xo.company.lan/rest/v0/vms/770aa52a-fd42-8faf-f167-8c5c4a237cac.xva?compress=zstd' \
  > myVM.xva
```

## VDI Export

A VM can be exported as an VHD at `/rest/v0/vdis/<uuid>.vhd`.

```bash
curl \
  -b authenticationToken=KQxQdm2vMiv7jBIK0hgkmgxKzemd8wSJ7ugFGKFkTbs \
  'https://xo.company.lan/rest/v0/vdis/1a269782-ea93-4c4c-897a-475365f7b674.vhd' \
  > myDisk.vhd
```

## The future

We are adding features and improving the REST API step by step. If you have interesting use cases or feedback, please ask directly at <https://xcp-ng.org/forum/category/12/xen-orchestra>
