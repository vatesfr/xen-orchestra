```js
import { debounceResource } from '@vates/disposable/debounceResource'
import { deduped } from '@vates/disposable/deduped'

// the connection with the passed host will be established once at the first call, then, it will be shared with the next calls
const getConnection = deduped(function (host)) {
  const connection = new Connection(host)
  return new Disposabe(connection, () => connection.close())
}, host => [host])


// it will wait for 10e3 before calling the disposer
using(debounceResource(getConnection(host), 10e3), connection => {})
```
