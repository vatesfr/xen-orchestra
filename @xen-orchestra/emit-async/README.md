<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @xen-orchestra/emit-async [![Build Status](https://travis-ci.org/vatesfr/xen-orchestra.png?branch=master)](https://travis-ci.org/vatesfr/xen-orchestra)

[![Package Version](https://badgen.net/npm/v/@xen-orchestra/emit-async)](https://npmjs.org/package/@xen-orchestra/emit-async) ![License](https://badgen.net/npm/license/@xen-orchestra/emit-async) [![PackagePhobia](https://badgen.net/packagephobia/install/@xen-orchestra/emit-async)](https://packagephobia.now.sh/result?p=@xen-orchestra/emit-async)

## Install

Installation of the [npm package](https://npmjs.org/package/@xen-orchestra/emit-async):

```
> npm install --save @xen-orchestra/emit-async
```

## Usage

```js
import EE from 'events'
import emitAsync from '@xen-orchestra/emit-async'

const ee = new EE()
ee.emitAsync = emitAsync

ee.on('start', async function() {
  // whatever
})

// similar to EventEmmiter#emit() but returns a promise which resolves when all
// listeners have resolved
await ee.emitAsync('start')

// by default, it will rejects as soon as one listener reject, you can customise
// error handling though:
await ee.emitAsync(
  {
    onError(error) {
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
