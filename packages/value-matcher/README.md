<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# value-matcher

[![Package Version](https://badgen.net/npm/v/value-matcher)](https://npmjs.org/package/value-matcher) ![License](https://badgen.net/npm/license/value-matcher) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/value-matcher)](https://bundlephobia.com/result?p=value-matcher) [![Node compatibility](https://badgen.net/npm/node/value-matcher)](https://npmjs.org/package/value-matcher)

> Simple pattern matching for plain values and objects

## Install

Installation of the [npm package](https://npmjs.org/package/value-matcher):

```sh
npm install --save value-matcher
```

## Usage

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

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

[ISC](https://spdx.org/licenses/ISC) © [Vates SAS](https://vates.fr)
