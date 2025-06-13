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
