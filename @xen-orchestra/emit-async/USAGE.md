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
