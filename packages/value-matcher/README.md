<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# value-matcher

[![Package Version](https://badgen.net/npm/v/value-matcher)](https://npmjs.org/package/value-matcher) ![License](https://badgen.net/npm/license/value-matcher) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/value-matcher)](https://bundlephobia.com/result?p=value-matcher) [![Node compatibility](https://badgen.net/npm/node/value-matcher)](https://npmjs.org/package/value-matcher)

## Install

Installation of the [npm package](https://npmjs.org/package/value-matcher):

```
> npm install --save value-matcher
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

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

[ISC](https://spdx.org/licenses/ISC) © [Vates SAS](https://vates.fr)
