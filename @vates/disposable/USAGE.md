This library contains utilities for disposables as defined by the [`promise-toolbox` library](https://github.com/JsCommunity/promise-toolbox#resource-management).

### `deduped(fn, keyFn)`

Creates a new function that wraps `fn` and instead of creating new disposables at each call, returns copies of the same one when `keyFn` returns the same keys.

Those copies contains the same value and can be disposed independently, the source disposable will only be disposed when all copies are disposed.

`keyFn` is called with the same context and arguments as the wrapping function and must returns an array of keys which will be used to identify which disposables should be grouped together.

```js
import { deduped } from '@vates/disposable/deduped'

// the connection with the passed host will be established once at the first call, then, it will be shared with the next calls
const getConnection = deduped(function (host)) {
  const connection = new Connection(host)
  return new Disposabe(connection, () => connection.close())
}, host => [host])
```

```js
import { createDebounceResource } from '@vates/disposable/debounceResource'

const debounceResource = createDebounceResource()

// it will wait for 10 seconds before calling the disposer
using(debounceResource(getConnection(host), 10e3), connection => {})
```
