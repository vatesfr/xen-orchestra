# REST API <!-- omit in toc -->

- [VM destruction](#vm-destruction)
- [VM Export](#vm-export)
- [VM Import](#vm-import)
- [VDI destruction](#vdi-destruction)
- [VDI Export](#vdi-export)
- [VDI Import](#vdi-import)
  - [Existing VDI](#existing-vdi)
  - [New VDI](#new-vdi)
- [Actions](#actions)
  - [Available actions](#available-actions)
  - [Start an action](#start-an-action)
- [The future](#the-future)

> This [REST](https://en.wikipedia.org/wiki/Representational_state_transfer)-oriented API is in beta, some minor changes may occur in the future.


## VM destruction

```sh
curl \
  -X DELETE \
  -b authenticationToken=KQxQdm2vMiv7jBIK0hgkmgxKzemd8wSJ7ugFGKFkTbs \
  'https://xo.company.lan/rest/v0/vms/770aa52a-fd42-8faf-f167-8c5c4a237cac'
```

## VM Export

A VM can be exported in XVA format at `/rest/v0/vms/<uuid>.xva` or in OVA format at `/rest/v0/vms/<uuid>.ova`.

By default, the XVA is not compressed, however the `compress` query parameter supports the following values:

- `gzip`: use [gzip](https://en.wikipedia.org/wiki/Gzip) compression (very slow)
- `zstd`: use [Zstandard](https://en.wikipedia.org/wiki/Zstd) compression (fast, only supported on XCP-ng)

```sh
curl \
  -b authenticationToken=KQxQdm2vMiv7jBIK0hgkmgxKzemd8wSJ7ugFGKFkTbs \
  'https://xo.company.lan/rest/v0/vms/770aa52a-fd42-8faf-f167-8c5c4a237cac.xva?compress=zstd' \
  > myVM.xva
```

## VM Import

> OVA import is not supported.

A VM can be imported by posting an XVA to `/rest/v0/pools/:id/vms`.

```sh
curl \
  -X POST \
  -b authenticationToken=KQxQdm2vMiv7jBIK0hgkmgxKzemd8wSJ7ugFGKFkTbs \
  -T myDisk.raw \
  'https://xo.company.lan/rest/v0/pools/355ee47d-ff4c-4924-3db2-fd86ae629676/vms?sr=357bd56c-71f9-4b2a-83b8-3451dec04b8f' \
  | cat
```

The `sr` query parameter can be used to specify on which SR the VM should be imported, if not specified, the default SR will be used.

> Note: the final `| cat` ensures cURL's standard output is not a TTY, which is necessary for upload stats to be displayed.

## VDI destruction

```sh
curl \
  -X DELETE \
  -b authenticationToken=KQxQdm2vMiv7jBIK0hgkmgxKzemd8wSJ7ugFGKFkTbs \
  'https://xo.company.lan/rest/v0/vdis/1a269782-ea93-4c4c-897a-475365f7b674'
```

## VDI Export

A VDI can be exported in VHD format at `/rest/v0/vdis/<uuid>.vhd` or the raw content at `/rest/v0/vdis/<uuid>.raw`.

The following optional query parameters are supported:

- `preferNbd`: will use NBD for export if available
- `nbdConcurrency=<integer>`: set the number of concurrent stream per disk if NBD is enabled, default 1

```sh
curl \
  -b authenticationToken=KQxQdm2vMiv7jBIK0hgkmgxKzemd8wSJ7ugFGKFkTbs \
  'https://xo.company.lan/rest/v0/vdis/1a269782-ea93-4c4c-897a-475365f7b674.vhd' \
  > myDisk.vhd
```

## VDI Import

### Existing VDI

A VHD or a raw export can be imported in an existing VDI respectively at `/rest/v0/vdis/<uuid>.vhd` and `/rest/v0/vdis/<uuid>.raw`.

> Note: the size of the VDI must match exactly the size of VDI that was previously exported.

```sh
curl \
  -X PUT \
  -b authenticationToken=KQxQdm2vMiv7jBIK0hgkmgxKzemd8wSJ7ugFGKFkTbs \
  -T myDisk.vhd \
  'https://xo.company.lan/rest/v0/vdis/1a269782-ea93-4c4c-897a-475365f7b674.vhd' \
  | cat
```

> Note: the final `| cat` ensures cURL's standard output is not a TTY, which is necessary for upload stats to be displayed.

### New VDI

An export can also be imported on an SR to create a new VDI at `/rest/v0/srs/<sr uuid>/vdis`.

```sh
curl \
  -X POST \
  -b authenticationToken=KQxQdm2vMiv7jBIK0hgkmgxKzemd8wSJ7ugFGKFkTbs \
  -T myDisk.raw \
  'https://xo.company.lan/rest/v0/srs/357bd56c-71f9-4b2a-83b8-3451dec04b8f/vdis?raw&name_label=my_imported_VDI' \
  | cat
```

> Note: the final `| cat` ensures cURL's standard output is not a TTY, which is necessary for upload stats to be displayed.

This request returns the UUID of the created VDI.

The following query parameters are supported to customize the created VDI:

- `name_label`
- `name_description`
- `raw`: this parameter must be used if importing a raw export instead of a VHD

## Actions

### Available actions

To see the actions available on objects of a specific collection, get the collection at `/rest/v0/<type>/_/actions`.

For example, to list all actions on a VM:

```console
$ curl \
  -b authenticationToken=KQxQdm2vMiv7jBIK0hgkmgxKzemd8wSJ7ugFGKFkTbs \
  'https://xo.company.lan/rest/v0/vms/_/actions'
[
"/rest/v0/vms/_/actions/clean_reboot",
"/rest/v0/vms/_/actions/clean_shutdown",
"/rest/v0/vms/_/actions/hard_reboot",
"/rest/v0/vms/_/actions/hard_shutdown",
"/rest/v0/vms/_/actions/snapshot",
"/rest/v0/vms/_/actions/start"
]
```

To see more information about a specific action, you can checkout its endpoint:

```console
$ curl \
  -b authenticationToken=KQxQdm2vMiv7jBIK0hgkmgxKzemd8wSJ7ugFGKFkTbs \
  'https://xo.company.lan/rest/v0/vms/_/actions/snapshot'
{
  "params": {
    "name_label": {
      "type": "string",
      "optional": true
    }
  }
}
```

The field `params` contains the [JSON schema](https://json-schema.org/) for the parameters.

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

By default, actions are asynchronous and return the reference of the task associated with the request (see [_Task monitoring_](#task-monitoring)).

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
