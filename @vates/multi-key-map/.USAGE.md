```js
import { MultiKeyMap } from '@vates/multi-key-map'

const map = new MultiKeyMap()

const OBJ = {}
map.set([], 0)
map.set(['foo'], 1)
map.set(['foo', 'bar'], 2)
map.set(['bar', 'foo'], 3)
map.set([OBJ], 4)
map.set([{}], 5)

map.get([]) // 0
map.get(['foo']) // 1
map.get(['foo', 'bar']) // 2
map.get(['bar', 'foo']) // 3
map.get([OBJ]) // 4
map.get([{}]) // undefined
```
