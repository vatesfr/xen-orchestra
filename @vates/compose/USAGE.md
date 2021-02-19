```js
import { compose } from '@vates/compose'

const add2 = x => x + 2
const mul3 = x => x * 3

// const f = x => mul3(add2(x))
const f = compose(add2, mul3)

console.log(f(5))
// → 21
```

The first function is called with the context and all arguments of the composed function:

```js
const add = (x, y) => x + y
const mul3 = x => x * 3

// const f = (x, y) => mul3(add(x, y))
const f = compose(add, mul3)

console.log(f(4, 5))
// → 27
```

Functions may also be passed in an array:

```js
const f = compose([add2, mul3])
```

Options can be passed as first parameters:

```js
const f = compose(
  {
    // compose async functions
    async: true,

    // compose from right to left
    right: true,
  },
  [add2, mul3]
)
```
