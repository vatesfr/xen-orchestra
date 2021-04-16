```js
import { compose } from '@vates/compose'

const add2 = x => x + 2
const mul3 = x => x * 3

// const f = x => mul3(add2(x))
const f = compose(add2, mul3)

console.log(f(5))
// → 21
```

> The call context (`this`) of the composed function is forwarded to all functions.

The first function is called with all arguments of the composed function:

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

Options can be passed as first parameter:

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
