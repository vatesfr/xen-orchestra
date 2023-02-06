<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @vates/coalesce-calls

[![Package Version](https://badgen.net/npm/v/@vates/coalesce-calls)](https://npmjs.org/package/@vates/coalesce-calls) ![License](https://badgen.net/npm/license/@vates/coalesce-calls) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@vates/coalesce-calls)](https://bundlephobia.com/result?p=@vates/coalesce-calls) [![Node compatibility](https://badgen.net/npm/node/@vates/coalesce-calls)](https://npmjs.org/package/@vates/coalesce-calls)

> Wraps an async function so that concurrent calls will be coalesced

## Install

Installation of the [npm package](https://npmjs.org/package/@vates/coalesce-calls):

```sh
npm install --save @vates/coalesce-calls
```

## Usage

```js
import { coalesceCalls } from '@vates/coalesce-calls'

const connect = coalesceCalls(async function () {
  // async operation
})

connect()

// the previous promise result will be returned if the operation is not
// complete yet
connect()
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
