<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @vates/json-hash

[![Package Version](https://badgen.net/npm/v/@vates/json-hash)](https://npmjs.org/package/@vates/json-hash) ![License](https://badgen.net/npm/license/@vates/json-hash) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@vates/json-hash)](https://bundlephobia.com/result?p=@vates/json-hash) [![Node compatibility](https://badgen.net/npm/node/@vates/json-hash)](https://npmjs.org/package/@vates/json-hash)

> Compute a stable hash from a JSON-ifiable value

## Install

Installation of the [npm package](https://npmjs.org/package/@vates/json-hash):

```sh
npm install --save @vates/json-hash
```

## Usage

The use for this librariy is to create a composite key from a JSON value, ignoring objects identity and properties order.

The hash algorithm used is intended to be fast and with low collisions and is not guaranteed to be be secure.

```js
import { jsonHash } from '@vates/json-hash'

console.log(jsonHash('foo'))
// → "siEyldVkkW+JpqQkVVZ8h8P0gPzXocFeIg8X1xaaeQs="

// order of properties is ignored
console.log(jsonHash({ foo: 0, bar: 1 }))
// → "JckoRSMIBjNlgEWIXhgpBOuyLQYqABZqvf1ccb3BPg0="
console.log(jsonHash({ bar: 1, foo: 0 }))
// → "JckoRSMIBjNlgEWIXhgpBOuyLQYqABZqvf1ccb3BPg0="
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
