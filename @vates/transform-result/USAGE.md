```js
import { transformResult } from '@vates/transform-result'

const getData = () => '{"foo":"bar"}'

const getParsedData = transformResult(getData, JSON.parse)

console.log(getParsedData())
// -> { foo: 'bar' }
```
