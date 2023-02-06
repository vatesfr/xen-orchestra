<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @vates/compose

[![Package Version](https://badgen.net/npm/v/@vates/compose)](https://npmjs.org/package/@vates/compose) ![License](https://badgen.net/npm/license/@vates/compose) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@vates/compose)](https://bundlephobia.com/result?p=@vates/compose) [![Node compatibility](https://badgen.net/npm/node/@vates/compose)](https://npmjs.org/package/@vates/compose)

> Compose functions from left to right

## Install

Installation of the [npm package](https://npmjs.org/package/@vates/compose):

```sh
npm install --save @vates/compose
```

## Usage

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

Functions can receive extra parameters:

```js
const isIn = (value, min, max) => min <= value && value <= max

// Only compatible when `fns` is passed as an array!
const f = compose([
  [add, 2],
  [isIn, 3, 10],
])

console.log(f(1))
// → true
```

> Note: if the first function is defined with extra parameters, it will only receive the first value passed to the composed function, instead of all the parameters.

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

[ISC](https://spdx.org/licenses/ISC) © [Vates SAS](https://vates.fr)
