<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @xen-orchestra/async-map

[![Package Version](https://badgen.net/npm/v/@xen-orchestra/async-map)](https://npmjs.org/package/@xen-orchestra/async-map) ![License](https://badgen.net/npm/license/@xen-orchestra/async-map) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@xen-orchestra/async-map)](https://bundlephobia.com/result?p=@xen-orchestra/async-map) [![Node compatibility](https://badgen.net/npm/node/@xen-orchestra/async-map)](https://npmjs.org/package/@xen-orchestra/async-map)

> Promise.all + map for all iterables

## Install

Installation of the [npm package](https://npmjs.org/package/@xen-orchestra/async-map):

```sh
npm install --save @xen-orchestra/async-map
```

## Usage

### `asyncMap(iterable, iteratee, thisArg = iterable)`

Similar to `Promise.all + Array#map` for all iterables: calls `iteratee` for each item in `iterable`, and returns a promise of an array containing the awaited result of each calls to `iteratee`.

It rejects as soon as te first call to `iteratee` rejects.

```js
import { asyncMap } from '@xen-orchestra/async-map'

const array = await asyncMap(iterable, iteratee, thisArg)
```

It can be used with any iterables (`Array`, `Map`, etc.):

```js
const map = new Map()
map.set('foo', 42)
map.set('bar', 3.14)

const array = await asyncMap(map, async function ([key, value]) {
  // TODO: do async computation
  //
  // the map can be accessed via `this`
})
```

#### Use with plain objects

Plain objects are not iterable, but you can use `Object.keys`, `Object.values` or `Object.entries` to help:

```js
const object = {
  foo: 42,
  bar: 3.14,
}

const array = await asyncMap(
  Object.entries(object),
  async function ([key, value]) {
    // TODO: do async computation
    //
    // the object can be accessed via `this` because it's been passed as third arg
  },
  object
)
```

### `asyncMapSettled(iterable, iteratee, thisArg = iterable)`

Similar to `asyncMap` but waits for all promises to settle before rejecting.

```js
import { asyncMapSettled } from '@xen-orchestra/async-map'

const array = await asyncMapSettled(iterable, iteratee, thisArg)
```

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

[ISC](https://spdx.org/licenses/ISC) © [Vates SAS](https://vates.fr)
