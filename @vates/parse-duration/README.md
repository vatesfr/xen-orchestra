<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @vates/parse-duration

[![Package Version](https://badgen.net/npm/v/@vates/parse-duration)](https://npmjs.org/package/@vates/parse-duration) ![License](https://badgen.net/npm/license/@vates/parse-duration) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@vates/parse-duration)](https://bundlephobia.com/result?p=@vates/parse-duration) [![Node compatibility](https://badgen.net/npm/node/@vates/parse-duration)](https://npmjs.org/package/@vates/parse-duration)

> Small wrapper around ms to parse a duration

## Install

Installation of the [npm package](https://npmjs.org/package/@vates/parse-duration):

```sh
npm install --save @vates/parse-duration
```

## Usage

`ms` without magic: always parse a duration and throws if invalid.

```js
import { parseDuration } from '@vates/parse-duration'

parseDuration('2 days')
// 172800000

parseDuration(172800000)
// 172800000

parseDuration(undefined)
// throws TypeError('not a valid duration: undefined')
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
