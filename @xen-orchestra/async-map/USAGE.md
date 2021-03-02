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
