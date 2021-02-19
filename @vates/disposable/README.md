<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @vates/disposable

[![Package Version](https://badgen.net/npm/v/@vates/disposable)](https://npmjs.org/package/@vates/disposable) ![License](https://badgen.net/npm/license/@vates/disposable) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@vates/disposable)](https://bundlephobia.com/result?p=@vates/disposable) [![Node compatibility](https://badgen.net/npm/node/@vates/disposable)](https://npmjs.org/package/@vates/disposable)

> Resource management

## Install

Installation of the [npm package](https://npmjs.org/package/@vates/disposable):

```
> npm install --save @vates/disposable
```

## Usage

```js
import { debounceResource } from '@vates/disposable/debounceResource'
import { deduped } from '@vates/disposable/deduped'

// the connection will be established once at the first call, then, its result will be shared with the next calls
const getConnection = deduped(function (host)) {
  const connection = new Connection(host)
  return new Disposabe(connection, () => connection.close())
}, host => [host])


// it will wait 10e3 after the call of the disposer
using(debounceResource(getConnection(host), 10e3), connection => {})
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
