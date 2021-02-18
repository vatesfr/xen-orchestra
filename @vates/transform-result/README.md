<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @vates/transform-result

[![Package Version](https://badgen.net/npm/v/@vates/transform-result)](https://npmjs.org/package/@vates/transform-result) ![License](https://badgen.net/npm/license/@vates/transform-result) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@vates/transform-result)](https://bundlephobia.com/result?p=@vates/transform-result) [![Node compatibility](https://badgen.net/npm/node/@vates/transform-result)](https://npmjs.org/package/@vates/transform-result)

> Applies passed transformer to the result returned by the wrapped function

## Install

Installation of the [npm package](https://npmjs.org/package/@vates/transform-result):

```
> npm install --save @vates/transform-result
```

## Usage

```js
import { transformResult } from '@vates/transform-result'

const getData = () => '{"foo":"bar"}'

const getParsedData = transformResult(getData, JSON.parse)

console.log(getParsedData())
// -> { foo: 'bar' }
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
