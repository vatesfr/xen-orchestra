<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @vates/multi-key-map

[![Package Version](https://badgen.net/npm/v/@vates/multi-key-map)](https://npmjs.org/package/@vates/multi-key-map) ![License](https://badgen.net/npm/license/@vates/multi-key-map) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@vates/multi-key-map)](https://bundlephobia.com/result?p=@vates/multi-key-map) [![Node compatibility](https://badgen.net/npm/node/@vates/multi-key-map)](https://npmjs.org/package/@vates/multi-key-map)

> Create map with values affected to multiple keys

## Install

Installation of the [npm package](https://npmjs.org/package/@vates/multi-key-map):

```sh
npm install --save @vates/multi-key-map
```

## Usage

```js
import { MultiKeyMap } from '@vates/multi-key-map'

const map = new MultiKeyMap()

const OBJ = {}
map.set([], 0)
map.set(['foo'], 1)
map.set(['foo', 'bar'], 2)
map.set(['bar', 'foo'], 3)
map.set([OBJ], 4)
map.set([{}], 5)

map.get([]) // 0
map.get(['foo']) // 1
map.get(['foo', 'bar']) // 2
map.get(['bar', 'foo']) // 3
map.get([OBJ]) // 4
map.get([{}]) // undefined
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
