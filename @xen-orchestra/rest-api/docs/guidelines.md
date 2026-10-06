# REST API guidelines

These rules are **mandatory** for any change under `@xen-orchestra/rest-api`. They complement, and never replace, the [backend project guidelines](../../../packages/xo-server/docs/guidelines.md).

They are not absolute rules, but expect to have to explain to the reviewer if the PR does not explicitly state why a guideline is not used.

The REST API is based on the `TSOA` framework and therefore we use decorators a lot to define the behavior of a route or a group of routes. To keep things easily visible, it is best to always use the decorators in the same order.

At the request of the DevOps team, any REST API PR that updates the OpenAPI specification must include a reviewer from the DevOps team. (Non-blocking for merge.)

## API design

Naming is hard, building a coherent API is hard: ask/propose naming **before** starting to push code.

- `GET` for getting information of an object or a collection
- `POST` for creating an object and for actions
- `PUT`/`PATCH` for updating an object without side effect

Use the `@Deprecated()` decorator if needed, and never remove a route without changing the API version.

### Resource consistency

For a given resource (VMs, VIFs, users, etc.), property names must be consistent across all endpoints. The types and names of properties must also be coherent with the types in `@vates/types/xo.mts`.

> Example: a PATCH request on a VM must use the same property names as the VM representation returned by the REST API.

```
GET /vms/:id
{
  name_label: 'Foo',
  name_description: 'Foo Bar',
  ...
}

PATCH /vms/:id
{
  name_label: 'Bar' // OK ✅
  nameDescription: 'Bar Foo' // Not OK ❌
}
```

## Code organisation

- the service must handle the domain/functional logic of one or multiple REST API routes
- the controller is focused on serving the result

## Decorators

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
 @Extension('x-mcp-exposure', 'allow')
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

### Route definition

- `@Get(route with named parameter)`: must be defined before writing code
- `@Middlewares(acl(...))`: ACLs are defined in `@xen-orchestra/acl/src/actions/`, and should be discussed before coding
- `@Extension('x-mcp-exposure', value)`: see [MCP exposure](#mcp-exposure)
- `@SuccessResponse(status, description)`: response in case of success. Statuses and descriptions are defined in `src/open-api/common/response.common.mts`. Take care of explaining any non obvious result, like an UUID change during VDI migration. This documentation must be clear for users out of the XO team, or even out of Vates.
- `@Response(status, description)`: possible responses including errors. Statuses and descriptions are defined in `src/open-api/common/response.common.mts`. Order by status code.
- `@Example` for **every** parameter and the body. Path parameters are the easy ones to forget — they have no body schema to fall back on, so list them explicitly (`@example id "…"`, `@example diskId "…"`)

### Route declaration order (tsoa)

tsoa's route-collision check is declaration-order sensitive: a `…/files.{format}` route declared **after** the plain `…/files` route is wrongly flagged as overlapping (it does a `startsWith`, not an equality, on the last segment). Declare each `.{format}` variant **before** its plain sibling.

## Examples

In order not to pollute important decorators, all example structures should be in a separate file: `src/open-api/oa-examples/<resource>.oa-example.mts`.

## Actions

REST API actions are reserved to user actions that won't fit the REST API. The REST API actions must use the `this.createAction` method to handle correctly synchronous and asynchronous mode.

If your action endpoint includes a request body, don't forget to add `params` to the `taskProperties` property (obfuscate sensitive params such as passwords)

```js
createAction(action, {
  //...
  taskProperties: {
    // ...
    params: body,
  },
})
```

On the caller side, action calls are asynchronous by default; the caller can add `sync=true` on any action call to force the synchronous mode.

## ACLs

To define an ACL for an endpoint, simply add the `acl` middleware and pass the required ACL(s).

If an endpoint does not have a middleware ACL, it will be accessible **ONLY** to administrators.

It is sometimes necessary to check ACLs based on the body of the request sent by the user (for example, for a PATCH endpoint). For this, you can use `actions` (which allows you to pass multiple actions) and `actionsFromBody` (a function exported from `acl.middleware.mts`).

`actionsFromBody(['update:nameLabel', 'update:nameDescription'])` checks if `nameLabel` is present in the request body, and then applies the ACL check. The same applies to `nameDescription`.

`actionIfNotSelfUser('read')` returns the given action only if the current user is **not** the target user. If the current user is the target (self), no action is returned and the ACL check is skipped entirely.

### Guidelines

- **JSDoc Documentation**: Always document the required privileges in the JSDoc annotation so users know which permissions are needed. Use the format: `Required privilege: - ...`
- **Error Handling**: If you define an ACL for an endpoint, you **must** add a `@Response(403)` decorator.
- **Non XAPI objects**: When dealing with non XAPI XO Record, you must define the `getObject` function.

#### Example: ACL on an existing resource

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

#### Example: Resource creation

```ts
/**
  * Create a new VDI
  *
  * Required privilege:
  * - resource: vdi, action: create
  */
 @Post('/')
 @Middlewares(acl({resource: 'vdi', action: 'create', object: ({req}) => req.body }))
 @Response(403)
 createVdi(@Body() body: VdiConfig) {
   const {srId, ...rest}
   const bodyParam = {$SR: srId, ...rest}
   await VDI_create(bodyParam)
   // ...
 }
```

#### Example: Resource update

```ts
/**
 * Update a VM
 *
   * Required privileges:
   * - resource: vm, action: update (grants all fields)
   * - resource: vm, action: update:nameLabel (if nameLabel is passed)
   * - resource: vm, action: update:nameDescription (if nameDescription is passed)
  */
 @Patch('{id}')
 @Middlewares(acl({resource: 'vm', actions: actionsFromBody(['update:nameLabel', 'update:nameDescription']), objectId: 'params.id'}))
 @Response(403)
 createVdi(@Path() id: string, @Body() body: patchBody) {
  updateVm(id, body)
// ...
 }
```

#### Example: Self-bypass ACL

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

If you need to use a privilege that doesn't exist yet (e.g., `resource: 'vm', action: 'foo'`), you must register it in the ACL definition: here `@xen-orchestra/acl/src/actions/vm.mts`, add: `foo: true`.

## MCP exposure

All REST API endpoints must define an MCP exposure policy using the `@Extension` decorator. This rule is enforced by the `require-mcp-expose` ESLint rule (`eslint-rules/require-mcp-expose.cjs`).

- `@Extension('x-mcp-exposure', 'allow')` for all `GET` endpoints. MCP can use this with the default permission of the user. Only for idempotent reads, with a constrained output size.
- `@Extension('x-mcp-exposure', 'confirm')` for all non-`GET` endpoints (`POST`, `PATCH`, `PUT`, `DELETE`, etc.). MCP will ask for the user permission before using it. For modifications, and bigger exports.
- `@Extension('x-mcp-exposure', 'deny')` only for exceptional cases. MCP won't use this endpoint. For example: binary export of VMs/disks/files.

## Status codes & errors

**Never hand-roll a status code** (`res.status(404)`). `throw` the semantic error from `xo-common/api-errors` and let `generic-error-handler.middleware` map it centrally. Reuse the shared descriptors in `src/open-api/common/response.common.mts` (`notFoundResp`, `invalidParameters`, …) instead of magic numbers. Throw an `ApiError`, set up with the right parameters, if a new error / error code is needed.

| Throw (`xo-common/api-errors`)                                | HTTP status |
| ------------------------------------------------------------- | ----------- |
| `noSuchObject(id, type)` (`NO_SUCH_OBJECT`)                   | 404         |
| `unauthorized` / `forbiddenOperation` / `featureUnauthorized` | 403         |
| `invalidCredentials`                                          | 401         |
| `objectAlreadyExists` / `incorrectState`                      | 409         |
| `invalidParameters`                                           | 422         |
| `notImplemented`                                              | 501         |

Throw `noSuchObject(id, type)` to get an automatic 404 when the routing doesn't already handle it. Resolve the object **first** so the 404 fires before any work starts.

## Streaming & file-download routes

- Obtain and validate the resource **before** setting any response header, so a `noSuchObject` returns a clean JSON 404 instead of a body labelled as a download
- Set `content-disposition: attachment; filename="…"` with a meaningful name built from domain labels (VM / disk / partition). Fold accents to ASCII and collapse anything outside `[\w.-]` so the header and the on-disk filename stay safe (also blocks header injection)
- Tie the stream to the request lifetime (`req.on('close', () => stream.destroy())`) so a client disconnect doesn't leak the export
