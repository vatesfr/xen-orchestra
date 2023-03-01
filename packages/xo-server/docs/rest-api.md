# REST API <!-- omit in toc -->

- [Authentication](#authentication)
- [Collections](#collections)
- [Properties update](#properties-update)
- [VM destruction](#vm-destruction)
- [VM Export](#vm-export)
- [VDI destruction](#vdi-destruction)
- [VDI Export](#vdi-export)
- [VDI Import](#vdi-import)
- [Actions](#actions)
  - [Available actions](#available-actions)
  - [Start an action](#start-an-action)
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

**[Not implemented at this time]** The server can request that the client updates its token with a `Set-Cookie` header:

```http
HTTP/1.1 200 OK
Set-Cookie: authenticationToken=KQxQdm2vMiv7jBIK0hgkmgxKzemd8wSJ7ugFGKFkTbs
```

Usage with cURL:

```sh
curl -b \
  authenticationToken=KQxQdm2vMiv7jBIK0hgkmgxKzemd8wSJ7ugFGKFkTbs \
  https://xo.company.lan/rest/v0/
```

You can use `xo-cli` to create an authentication token:

```sh
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

## Properties update

> This feature is restricted to `name_label` and `name_description` at the moment.

```sh
curl \
  -X PATCH \
  -b authenticationToken=KQxQdm2vMiv7jBIK0hgkmgxKzemd8wSJ7ugFGKFkTbs \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{ "name_label": "The new name", "name_description": "The new description" }' \
  'https://xo.company.lan/rest/v0/vms/770aa52a-fd42-8faf-f167-8c5c4a237cac'
```

## VM destruction

```sh
curl \
  -X DELETE \
  -b authenticationToken=KQxQdm2vMiv7jBIK0hgkmgxKzemd8wSJ7ugFGKFkTbs \
  'https://xo.company.lan/rest/v0/vms/770aa52a-fd42-8faf-f167-8c5c4a237cac'
```

## VM Export

A VM can be exported as an XVA at `/rest/v0/vms/<uuid>.xva`.

By default, the XVA is not compressed, however the `compress` query parameter supports the following values:

- `gzip`: use [gzip](https://en.wikipedia.org/wiki/Gzip) compression (very slow)
- `zstd`: use [Zstandard](https://en.wikipedia.org/wiki/Zstd) compression (fast, only supported on XCP-ng)

```sh
curl \
  -b authenticationToken=KQxQdm2vMiv7jBIK0hgkmgxKzemd8wSJ7ugFGKFkTbs \
  'https://xo.company.lan/rest/v0/vms/770aa52a-fd42-8faf-f167-8c5c4a237cac.xva?compress=zstd' \
  > myVM.xva
```

## VDI destruction

```sh
curl \
  -X DELETE \
  -b authenticationToken=KQxQdm2vMiv7jBIK0hgkmgxKzemd8wSJ7ugFGKFkTbs \
  'https://xo.company.lan/rest/v0/vdis/1a269782-ea93-4c4c-897a-475365f7b674'
```

## VDI Export

A VDI can be exported in VHD format at `/rest/v0/vdis/<uuid>.vhd` or the raw content at `/rest/v0/vdis/<uuid>.raw`.

```sh
curl \
  -b authenticationToken=KQxQdm2vMiv7jBIK0hgkmgxKzemd8wSJ7ugFGKFkTbs \
  'https://xo.company.lan/rest/v0/vdis/1a269782-ea93-4c4c-897a-475365f7b674.vhd' \
  > myDisk.vhd
```

## VDI Import

A VHD or a raw export can be imported on an SR to create a new VDI at `/rest/v0/srs/<sr uuid>/vdis`.

```sh
curl \
  -X POST \
  -b authenticationToken=KQxQdm2vMiv7jBIK0hgkmgxKzemd8wSJ7ugFGKFkTbs \
  -T myDisk.raw \
  'https://xo.company.lan/rest/v0/srs/357bd56c-71f9-4b2a-83b8-3451dec04b8f/vdis?raw&name_label=my_imported_VDI' \
  | cat
```

> Note: the final `| cat` ensures cURL's standard output is not a TTY, which is necessary for upload stats to be dislayed.

This request returns the UUID of the created VDI.

The following query parameters are supported to customize the created VDI:

- `name_label`
- `name_description`
- `raw`: this parameter must be used if importing a raw export instead of a VHD

## Actions

### Available actions

To see the actions available on a given object, get the collection at `/rest/v0/<type>/<uuid>/actions`.

For example, to list all actions on a given VM:

```sh
curl \
  -b authenticationToken=KQxQdm2vMiv7jBIK0hgkmgxKzemd8wSJ7ugFGKFkTbs \
  'https://xo.company.lan/rest/v0/vms/770aa52a-fd42-8faf-f167-8c5c4a237cac/actions'
```

### Start an action

Post at the action endpoint which is `/rest/v0/<type>/<uuid>/actions/<action>`.

For instance, to reboot a VM:

```sh
curl \
  -X POST \
  -b authenticationToken=KQxQdm2vMiv7jBIK0hgkmgxKzemd8wSJ7ugFGKFkTbs \
  'https://xo.company.lan/rest/v0/vms/770aa52a-fd42-8faf-f167-8c5c4a237cac/actions/clean_reboot'
```

Some actions accept parameters, they should be provided in a JSON-encoded object as the request body:

```sh
curl \
  -X POST \
  -b authenticationToken=KQxQdm2vMiv7jBIK0hgkmgxKzemd8wSJ7ugFGKFkTbs \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{ "name_label": "My snapshot" }' \
  'https://xo.company.lan/rest/v0/vms/770aa52a-fd42-8faf-f167-8c5c4a237cac/actions/snapshot'
```

By default, actions are asynchronous and return the reference of the task associated with the request.

> Tasks monitoring is still under construcration and will come in a future release :)

The `?sync` flag can be used to run the action synchronously without requiring task monitoring. The result of the action will be returned encoded as JSON:

```console
$ curl \
  -X POST \
  -b authenticationToken=KQxQdm2vMiv7jBIK0hgkmgxKzemd8wSJ7ugFGKFkTbs \
  'https://xo.company.lan/rest/v0/vms/770aa52a-fd42-8faf-f167-8c5c4a237cac/actions/clean_reboot'
"2b0266aa-c753-6fbc-e4dd-c79be7782052"
```

## The future

We are adding features and improving the REST API step by step. If you have interesting use cases or feedback, please ask directly at <https://xcp-ng.org/forum/category/12/xen-orchestra>
