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

## Supported predicates

### `any`

The value must be strictly equal to the pattern.

```js
const predicate = createPredicate(42)

predicate(42) // true
predicate('foo') // false
```

### `{ [property: string]: Pattern }`

The value must be an object with all pattern properties matching.

```js
const predicate = createPredicate({ foo: 'bar' })

predicate({ foo: 'bar', baz: 42 }) // true
predicate('foo') // false
```

### `Pattern[]`

The value must be an array with some of its items matching each of pattern items.

```js
const predicate = createPredicate([42, { foo: 'bar' }])

predicate([false, { foo: 'bar', baz: 42 }, null, 42]) // true
predicate('foo') // false
```

### `{ __and: Pattern[] }`

All patterns must match.

### `{ __or: Pattern[] }`

At least one pattern must match.

### `{ __not: Pattern }`

The pattern must not match.
