```js
import * as CM from 'complex-matcher'

const characters = [
  { name: 'Catwoman', costumeColor: 'black' },
  { name: 'Superman', costumeColor: 'blue', hasCape: true },
  { name: 'Wonder Woman', costumeColor: 'blue' },
]

const predicate = CM.parse('costumeColor:blue hasCape?').createPredicate()

characters.filter(predicate)
// [
//   { name: 'Superman', costumeColor: 'blue', hasCape: true },
// ]

new CM.String('foo').createPredicate()
```
