<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @vates/nbd-client

[![Package Version](https://badgen.net/npm/v/@vates/nbd-client)](https://npmjs.org/package/@vates/nbd-client) ![License](https://badgen.net/npm/license/@vates/nbd-client) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@vates/nbd-client)](https://bundlephobia.com/result?p=@vates/nbd-client) [![Node compatibility](https://badgen.net/npm/node/@vates/nbd-client)](https://npmjs.org/package/@vates/nbd-client)

## Install

Installation of the [npm package](https://npmjs.org/package/@vates/nbd-client):

```sh
npm install --save @vates/nbd-client
```

## Usage

### `new NdbClient({address, exportname, secure = true, port = 10809})`

create a new nbd client

```js
import NbdClient from '@vates/nbd-client'
const client = new NbdClient({
  address: 'MY_NBD_HOST',
  exportname: 'MY_SECRET_EXPORT',
  cert: 'Server certificate', // optional, will use encrypted link if provided
})

await client.connect()
const block = await client.readBlock(blockIndex, BlockSize)
await client.disconnect()
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
