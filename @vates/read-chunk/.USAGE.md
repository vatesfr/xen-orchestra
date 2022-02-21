- returns the next available chunk of data
- like `stream.read()`, a number of bytes can be specified
- returns `null` if the stream has ended

```js
import { readChunk } from '@vates/read-chunk'
;(async () => {
  let chunk
  while ((chunk = await readChunk(stream, 1024)) !== null) {
    // do something with chunk
  }
})()
```
