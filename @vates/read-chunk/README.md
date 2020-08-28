<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @vates/read-chunk

[![Package Version](https://badgen.net/npm/v/@vates/read-chunk)](https://npmjs.org/package/@vates/read-chunk) ![License](https://badgen.net/npm/license/@vates/read-chunk) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@vates/read-chunk)](https://bundlephobia.com/result?p=@vates/read-chunk) [![Node compatibility](https://badgen.net/npm/node/@vates/read-chunk)](https://npmjs.org/package/@vates/read-chunk)

> Read a chunk of a Node stream

## Install

Installation of the [npm package](https://npmjs.org/package/@vates/read-chunk):

```
> npm install --save @vates/read-chunk
```

## Usage

- returns the next available chunk of data
- like `stream.read()`, a number of bytes can be specified
- returns `null` if the stream has ended

```js
import { readChunk } from '@vates/read-chunk'
;(async () => {
  let chunk
  while ((chunk = await readChunk(stream, 1024)) !== null) {
    // do something with chunk
  }
})()
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
