<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @vates/decorate-result

[![Package Version](https://badgen.net/npm/v/@vates/decorate-result)](https://npmjs.org/package/@vates/decorate-result) ![License](https://badgen.net/npm/license/@vates/decorate-result) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@vates/decorate-result)](https://bundlephobia.com/result?p=@vates/decorate-result) [![Node compatibility](https://badgen.net/npm/node/@vates/decorate-result)](https://npmjs.org/package/@vates/decorate-result)

> Creates a decorator from a result transformer

## Install

Installation of the [npm package](https://npmjs.org/package/@vates/decorate-result):

```
> npm install --save @vates/decorate-result
```

## Usage

```js
import { decorateResult } from '@vates/decorate-result'

class Foo {
  @decorateResult(JSON.parse)
  bar() {
    // body
  }
}
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
