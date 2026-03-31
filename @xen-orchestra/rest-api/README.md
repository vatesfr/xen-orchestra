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

In order not to pollute important decorators, all example structures should be in a separate file. `src/open-api/oa-examples/<resource>.oa-example.mts`

### ACLs

To define an ACL for an endpoint, simply add the `acl` middleware and pass the required ACL(s).

If an endpoint does not have a middleware ACL, it will be accessible **ONLY** to administrators.

It is sometimes necessary to check ACLs based on the body of the request sent by the user (for example, for a PATCH endpoint). For this, you can use `actions` (which allows you to pass multiple actions) and `actionsFromBody` (a function exported from `acl.middleware.mts`).

`actionsFromBody(['update:name_label', 'update:name_description'])` checks if `name_label` is present in the request body, and then applies the ACL check. The same applies to `name_description`.

`actionIfNotSelfUser('read')` returns the given action only if the current user is **not** the target user. If the current user is the target (self), no action is returned and the ACL check is skipped entirely.

#### Guidelines

- **JSDoc Documentation**: Always document the required privileges in the JSDoc annotation so users know which permissions are needed. Use the format: `Required privilege: - ...`
- **Error Handling**: If you define an ACL for an endpoint, you **must** add a `@Response(403)` decorator.
- **Non XAPI objects**: When dealing with non XAPI XO Record, you must define the `getObject` function.

##### Example: ACL on an existing resource

```ts
 /**
  * Start a VM
  *
  * Required privilege:
  * - resource: vm, action: start
  */
 @Post('{id}/actions/start')
 @Middlewares(acl({resource: 'vm', action: 'start', objectId: 'params.id'}))
 @Response(403)
 getVm(@Path() id: string) {
    const action = async () => {
      const vm = await this.getObject(id)
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
 @Middlewares(acl({resource: 'vdi', action: 'create', object: ({req}) => {
  const {srId,...rest} = req.body
  return {$SR: srId, ...rest}
 }}))
 @Response(403)
 createVdi(@Body() body: VdiConfig) {
   const {srId, ...rest}
   const bodyParam = {$SR: srId, ...rest}
   await VDI_create(bodyParam)
   // ...
 }
```

##### Example: Resource update

When creating a resource (which doesn't exist yet), pass the object being created as the target:

```ts
/**
 * Update a VM
 *
   * Required privileges:
   * - resource: vm, action: update (grants all fields)
   * - resource: vm, action: update:name_label (if name_label is passed)
   * - resource: vm, action: update:name_description (if name_description is passed)
  */
 @Patch('{id}')
 @Middlewares(acl({resource: 'vm', actions: actionsFromBody(['update:name_label', 'update:name_description']), objectId: 'params.id'}))
 @Response(403)
 createVdi(@Path() id: string, @Body() body: patchBody) {
  updateVm(id, body)
// ...
 }
```

##### Example: Self-bypass ACL

```ts
/**
 * Get a user
 *
 * Required privilege:
 * - resource: user, action: read (if not self)
 */
@Get('{id}')
@Middlewares(acl({
  resource: 'user',
  actions: actionsIfNotSelfUser(['read']),
  objectId: 'params.id',
  getObject: ({ restApi }) => restApi.xoApp.getUser,
}))
@Response(403)
getUser(@Path() id: string) { ... }
```

If you need to use a privilege that doesn't exist yet (e.g., `resource: 'vm', action: 'foo'`), you must register it in ACL Definition: here `@xen-orchestra/acl/src/actions/vm.mts`, add: `foo: true`.

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

[AGPL-3.0-or-later](https://spdx.org/licenses/AGPL-3.0-or-later) © [Vates SAS](https://vates.fr)
