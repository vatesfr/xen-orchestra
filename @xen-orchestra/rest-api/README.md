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
  * any jsdoc anotations
  * @example id 1234
  */
 @Example(['foo', 'bar'])
 @Get('{id}')
 @Security('*')
 @Middlewares(json())
 @SuccessResponse(202)
 @Response(404)
 getFoo(@Path() id: string) {
    return this.getFoo(id)
 }
}
```

### Examples

In order not to pollute important decorators, all example structures should be in a separate file. `src/open-api/examples/<resource>.example.mts`

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

[AGPL-3.0-or-later](https://spdx.org/licenses/AGPL-3.0-or-later) © [Vates SAS](https://vates.fr)
