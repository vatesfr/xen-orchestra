`ms` without magic: always parse a duration and throws if invalid.

```js
import { parseDuration } from '@vates/parse-duration'

parseDuration('2 days')
// 172800000

parseDuration(172800000)
// 172800000

parseDuration(undefined)
// throws TypeError('not a valid duration: undefined')
```
