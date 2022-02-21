<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @vates/predicates

[![Package Version](https://badgen.net/npm/v/@vates/predicates)](https://npmjs.org/package/@vates/predicates) ![License](https://badgen.net/npm/license/@vates/predicates) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@vates/predicates)](https://bundlephobia.com/result?p=@vates/predicates) [![Node compatibility](https://badgen.net/npm/node/@vates/predicates)](https://npmjs.org/package/@vates/predicates)

> Utilities to compose predicates

## Install

Installation of the [npm package](https://npmjs.org/package/@vates/predicates):

```
> npm install --save @vates/predicates
```

## Usage

`undefined` predicates are ignored and `undefined` is returned if all predicates are `undefined`, this permits the most efficient composition:

```js
const compositePredicate = every(undefined, some(predicate2, undefined))

// ends up as

const compositePredicate = predicate2
```

Predicates can also be passed wrapped in an array:

```js
const compositePredicate = every([predicate1, some([predicate2, predicate3])])
```

`this` and all arguments are passed to the nested predicates.

### `every(predicates)`

> Returns a predicate that returns `true` iff every predicate returns `true`.

```js
const isBetween3And7 = every(
  n => n >= 3,
  n => n <= 7
)

isBetween3And10(0)
// → false

isBetween3And10(5)
// → true

isBetween3And10(10)
// → false
```

### `some(predicates)`

> Returns a predicate that returns `true` iff some predicate returns `true`.

```js
const isAliceOrBob = some(
  name => name === 'Alice',
  name => name === 'Bob'
)

isAliceOrBob('Alice')
// → true

isAliceOrBob('Bob')
// → true

isAliceOrBob('Oscar')
// → false
```

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

[ISC](https://spdx.org/licenses/ISC) © [Vates SAS](https://vates.fr)
