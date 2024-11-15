<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @xen-orchestra/defined

[![Package Version](https://badgen.net/npm/v/@xen-orchestra/defined)](https://npmjs.org/package/@xen-orchestra/defined) ![License](https://badgen.net/npm/license/@xen-orchestra/defined) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@xen-orchestra/defined)](https://bundlephobia.com/result?p=@xen-orchestra/defined) [![Node compatibility](https://badgen.net/npm/node/@xen-orchestra/defined)](https://npmjs.org/package/@xen-orchestra/defined)

> Utilities to help handling (possibly) undefined values

## Install

Installation of the [npm package](https://npmjs.org/package/@xen-orchestra/defined):

```sh
npm install --save @xen-orchestra/defined
```

## Usage

### `defined()`

Returns the first non-`undefined` value from a list of arguments, evaluating functions if needed.

There is two ways to use this function:

- either with a single array argument: it should return the first non-undefined item
- or with multiple arguments: it should return the first non-undefined argument

If only `undefined` values, return `undefined`.

```js
import defined from '@xen-orchestra/defined/index.js'

defined(undefined, 'foo', 42)
// Returns 'foo'

defined([undefined, null, 10])
// Returns null

defined([undefined, undefined], [undefined, undefined, 10])
// Returns [undefined, undefined]

defined(() => 'bar', 42)
// Returns 'bar'

defined(undefined, undefined)
// Returns undefined
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
