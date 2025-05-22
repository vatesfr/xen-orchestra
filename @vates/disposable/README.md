<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @vates/disposable

[![Package Version](https://badgen.net/npm/v/@vates/disposable)](https://npmjs.org/package/@vates/disposable) ![License](https://badgen.net/npm/license/@vates/disposable) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@vates/disposable)](https://bundlephobia.com/result?p=@vates/disposable) [![Node compatibility](https://badgen.net/npm/node/@vates/disposable)](https://npmjs.org/package/@vates/disposable)

> Utilities for disposables

## Install

Installation of the [npm package](https://npmjs.org/package/@vates/disposable):

```sh
npm install --save @vates/disposable
```

## Usage

This library contains utilities for disposables as defined by the [`promise-toolbox` library](https://github.com/JsCommunity/promise-toolbox#resource-management).

### `deduped(fn, keyFn)`

Creates a new function that wraps `fn` and instead of creating a new disposables at each call, returns copies of the same one when `keyFn` returns the same keys.

Those copies contains the same value and can be disposed independently, the source disposable will only be disposed when all copies are disposed.

`keyFn` is called with the same context and arguments as the wrapping function and must returns an array of keys which will be used to identify which disposables should be grouped together.

```js
import { deduped } from '@vates/disposable/deduped'

// the connection with the passed host will be established once at the first call, then, it will be shared with the next calls
const getConnection = deduped(async function (host)) {
  const connection = new Connection(host)
  return new Disposable(connection, () => connection.close())
}, host => [host])
```

### `debounceResource(disposable, delay)`

Creates a new disposable with the same value and with a delayed disposer.

On calling this disposer, the source disposable will be disposed when the `delay` is passed.

```js
import { createDebounceResource } from '@vates/disposable/debounceResource'

const debounceResource = createDebounceResource()

// it will wait for 10 seconds before calling the disposer
Disposable.use(debounceResource(getConnection(host), 10e3), connection => {})
```

### `debounceResource.flushAll()`

Disposes all delayed disposers and cancels the delaying of the disposables that are in usage.

```js
import { createDebounceResource } from '@vates/disposable/debounceResource'

const debounceResource = createDebounceResource()

const res1 = await debounceResource(res, 10e3)
const res2 = await debounceResource(res, 10e3)
const res3 = await debounceResource(res, 10e3)

rest1.dispose()
rest2.dispose()
// res3 is in usage

debounceResource.flushAll()
// res1 and res2 are immediately disposed
// res3 will be disposed immediately when its disposer will be called
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
