```js
import { debounceResource } from '@vates/disposable/debounceResource'
import { deduped } from '@vates/disposable/deduped'

// the connection will be established once at the first call, then, its result will be shared with the next calls
const getConnection = deduped(function (host)) {
  const connection = new Connection(host)
  return new Disposabe(connection, () => connection.close())
}, host => [host])


// it will wait 10e3 after the call of the disposer
using(debounceResource(getConnection(host), 10e3), connection => {})
```
