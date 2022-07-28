# REST API

:::warning ⚠️ Alpha feature
This is an alpha feature that may change significantly in the coming months - do not use this feature in a production environment. The fully up-to-date README [is available here](https://github.com/vatesfr/xen-orchestra/blob/master/packages/xo-server/docs/rest-api.md). This page is only here to explain how it works, it's not intended to be used as an accurate guide.
:::

We originally developed [our existing API](architecture.html#api) to be used between the Web UI `xo-web` and the server backend, `xo-server`. That's why it's a JSON-RPC API connected via websockets, allowing us to update objects live in the browser. This is perfect for our usage, but a bit complicated for others.

Also, this API wasn't meant to be public, but over the years some users have expressed a desire to be able to use it for their own purposes. This led us to add more tooling around it, like `xo-cli` and to answer specific requests.

For these reasons we decided to build a new API. Not an evolution of the current one, but 100% new. It is meant to be public and [REST-like](https://en.wikipedia.org/wiki/Representational_state_transfer). So a simple curl command can request it. We will also provide documentation as the intended goal is for it to be used by the public.

## Authentication

A valid authentication token should be attached as a cookie to all HTTP
requests:

```http
GET /rest/v0 HTTP/1.1
Cookie: authenticationToken=TN2YBOMYtXB_hHtf4wTzm9p5tTuqq2i15yeuhcz2xXM
```

The server will respond to an invalid token with a `401 Unauthorized` status.

**[Not implemented at this time]** The server can request that the client updates its token with a `Set-Cookie` header:

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

:::tip
Only admin users can currently use the API.
:::

## Collections request

Collections of objects are available at `/<name>` (e.g. `/vms`)

The following query parameters are supported:

- `limit`: max number of objects returned
- `fields`: if specified, instead of plain URLs, the results will be objects containing the requested fields
- `filter`: a string that will be used to select only matching objects, see [the syntax documentation](manage_infrastructure.md#live-filter-search)
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

Here is an example with `curl`:

```bash
curl \
    -b authenticationToken=0OQIKwb1WjeHtch25Ls \
    http://xoa.example.com/rest/v0/vms?fields=name_label,power_state
[
  {
    "name_label": "FreeNAS",
    "power_state": "Running",
    "href": "/rest/v0/vms/0fc14abc-ae7a-4209-79c4-d20ca1f0e567"
  },
  {
    "name_label": "Ubuntu 20.04 test",
    "power_state": "Halted",
    "href": "/rest/v0/vms/d505eb99-164e-5516-27e1-43837a01be45"
  },
  {
    "name_label": "Rocky Linux 8",
    "power_state": "Halted",
    "href": "/rest/v0/vms/38f423b7-1498-ee8c-ca8d-d3bb8fcffcf2"
  },
  {
    "name_label": "XOA 🎷",
    "power_state": "Running",
    "href": "/rest/v0/vms/857e34e5-c61a-f3f1-65e6-a7a9306b347b"
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

## VM and VDI export

VDI export and VM export are supported by the API. Below is a simple example to export a VM with `zstd` compression into a `myVM.xva` file:

```bash
curl \
  -b authenticationToken=KQxQdm2vMiv7jFEAZXOAGKFkTbs \
  'https://xoa.example.org/rest/v0/vms/770aa52a-fd42-8faf-f167-8c5c4a237a12.xva?compress=zstd' \
  > myVM.xva
```

For a VHD export, it's very similar:

```bash
curl \
  -b authenticationToken=KQxQdm2vMiv7FkTbs \
  'https://xoa.example.org/rest/v0/vdis/1a269782-ea93-4c4c-897a-475365f7b674.vhd' \
  > myDisk.vhd
```

## VDI Import

A VHD or a raw export can be imported on an SR to create a new VDI at `/rest/v0/srs/<sr uuid>/vdis`.

```bash
curl \
  -X POST \
  -b authenticationToken=KQxQdm2vMiv7jBIK0hgkmgxKzemd8wSJ7ugFGKFkTbs \
  -T myDisk.raw \
  'https://xo.example.org/rest/v0/srs/357bd56c-71f9-4b2a-83b8-3451dec04b8f/vdis?raw&name_label=my_imported_VDI' \
  | cat
```

> Note: the final `| cat` ensures cURL's standard output is not a TTY, which is necessary for upload stats to be dislayed.

This request returns the UUID of the created VDI.

The following query parameters are supported to customize the created VDI:

- `name_label`
- `name_description`
- `raw`: this parameter must be used if importing a raw export instead of a VHD

## The future

We are adding features and improving the REST API step by step. If you have interesting use cases or feedback, please ask directly at <https://xcp-ng.org/forum/category/12/xen-orchestra>
