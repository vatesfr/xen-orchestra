<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @xen-orchestra/emit-async

[![Package Version](https://badgen.net/npm/v/@xen-orchestra/emit-async)](https://npmjs.org/package/@xen-orchestra/emit-async) ![License](https://badgen.net/npm/license/@xen-orchestra/emit-async) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@xen-orchestra/emit-async)](https://bundlephobia.com/result?p=@xen-orchestra/emit-async) [![Node compatibility](https://badgen.net/npm/node/@xen-orchestra/emit-async)](https://npmjs.org/package/@xen-orchestra/emit-async)

> Emit an event for async listeners to settle

## Install

Installation of the [npm package](https://npmjs.org/package/@xen-orchestra/emit-async):

```sh
npm install --save @xen-orchestra/emit-async
```

## Usage

```js
import EE from 'events'
import emitAsync from '@xen-orchestra/emit-async'

const ee = new EE()

// exposing emitAsync on our event emitter
//
// it's not required though and we could have used directly via
// emitAsync.call(ee, event, args...)
ee.emitAsync = emitAsync

ee.on('start', async function () {
  // whatever
})

// similar to EventEmmiter#emit() but returns a promise which resolves when all
// listeners have settled
await ee.emitAsync('start')

// by default, it will rejects as soon as one listener reject, you can customise
// error handling though:
await ee.emitAsync(
  {
    onError(error, event, listener) {
      console.warn(error)
    },
  },
  'start'
)
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
