```js
import { coalesceCalls } from '@vates/coalesce-calls'

const connect = coalesceCalls(async function () {
  // async operation
})

connect()

// the previous promise result will be returned if the operation is not
// complete yet
connect()
```
