<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @xen-orchestra/rest-api

[![Package Version](https://badgen.net/npm/v/@xen-orchestra/rest-api)](https://npmjs.org/package/@xen-orchestra/rest-api) ![License](https://badgen.net/npm/license/@xen-orchestra/rest-api) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@xen-orchestra/rest-api)](https://bundlephobia.com/result?p=@xen-orchestra/rest-api) [![Node compatibility](https://badgen.net/npm/node/@xen-orchestra/rest-api)](https://npmjs.org/package/@xen-orchestra/rest-api)

> REST API to manage your XOA

## Install

Installation of the [npm package](https://npmjs.org/package/@xen-orchestra/rest-api):

```sh
npm install --save @xen-orchestra/rest-api
```

## Usage

# @xen-orchestra/rest-api

## Rules

The REST API is based on the `TSOA` framework and therefore we use decorators a lot to define the behavior of a route or a group of routes. To keep things easily visible, it is best to always use the decorators in the same order.

### Class decorator

```ts
@Routes('foo')
@Security('*')
@Response(401)
@Tags('foo')
@provide(Foo)
class Foo extends Controller {}
```

### Methods decorator

```ts
@Routes('foo')
...
class Foo extends Controller {


 /**
  * any jsdoc annotations
  * @example id 1234
  */
 @Example(['foo', 'bar'])
 @Get('{id}')
 @Security('*')
 @Middlewares(json())
 @Tags('foo')
 @SuccessResponse(202)
 @Response(404)
 getFoo(@Path() id: string) {
    return this.getFoo(id)
 }
}
```

### Examples

In order not to pollute important decorators, all example structures should be in a separate file. `src/open-api/examples/<resource>.example.mts`

### ACLs

To define an ACL for an endpoint, simply call the `this.checkAcls` method and pass the required ACL(s).

#### Guidelines

- **JSDoc Documentation**: Always document the required privileges in the JSDoc annotation so users know which permissions are needed. Use the format: `Required privilege: - ...`
- **Error Handling**: If you define an ACL for an endpoint, you **must** add a `@Response(403)` decorator.
- **Action Tracking**: If your endpoint is an action, call `checkAcls` **inside** the action logic. This ensures that if the check throws an error, the trace is correctly preserved in the logs of the associated action.

---

#### Usage & Scoping

The `objects` property passed to `checkAcls` depends on the context of your request:

| Case                  | `objects` value    | Description                              |
| :-------------------- | :----------------- | :--------------------------------------- |
| **Existing Resource** | `vm`, `host`, etc. | The existing XO object(s)                |
| **Creation**          | `body`, etc.       | The object you are attempting to create. |

##### Example: Action on an existing resource

```ts
 /**
  * Start a VM
  *
  * Required privilege:
  * - resource: vm, action: start
  */
 @Post('{id}/actions/start')
 @Response(403)
 getVm(@Path() id: string) {
    const action = async () => {
      const vm = await this.getObject(id)
      await this.checkAcls({ resource: 'vm', action: 'start', objects: vm })
      // ...
    }
 }
```

##### Example: Resource creation

When creating a resource (which doesn't exist yet), pass the object being created as the target:

```ts
/**
  * Create a new VDI
  *
  * Required privilege:
  * - resource: vdi, action: create
  */
 @Post('/')
 @Response(403)
 createVdi(@Body() body: VdiConfig) {
   const {srId, ...rest}
   const bodyParam = {$SR: srId, ...rest}
   // Pass the body (the object to be created) to check permissions
   await this.checkAcls({ resource: 'vdi', action: 'create', objects: bodyParam })
   await VDI_create(bodyParam)
   // ...
 }
```

If you need to use a privilege that doesn't exist yet (e.g., `resource: 'vm', action: 'foo'`), you must register it in two places:

- ACL Definition: In `@xen-orchestra/acl/src/actions/vm.mts`, add: `foo: true`.
- Type Definition: In `@xen-orchestra/rest-api/src/acl-privileges/acl-privilege.type.mts`, add `foo` to the `vm` resource.

Don't worry about forgetting a step: if a resource or action is missing in either location, the build will fail with an explicit error message explaining what is missing.

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

[AGPL-3.0-or-later](https://spdx.org/licenses/AGPL-3.0-or-later) © [Vates SAS](https://vates.fr)
