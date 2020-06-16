```js
import { createPredicate } from 'value-matcher'

;[
  { user: 'sam', age: 65, active: false },
  { user: 'barney', age: 36, active: true },
  { user: 'fred', age: 40, active: false },
].filter(
  createPredicate({
    __or: [{ user: 'sam' }, { active: true }],
  })
)
// [
//   { user: 'sam', age: 65, active: false },
//   { user: 'barney', age: 36, active: true },
// ]
```
