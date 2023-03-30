<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @vates/read-chunk

[![Package Version](https://badgen.net/npm/v/@vates/read-chunk)](https://npmjs.org/package/@vates/read-chunk) ![License](https://badgen.net/npm/license/@vates/read-chunk) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@vates/read-chunk)](https://bundlephobia.com/result?p=@vates/read-chunk) [![Node compatibility](https://badgen.net/npm/node/@vates/read-chunk)](https://npmjs.org/package/@vates/read-chunk)

> Read a chunk of a Node stream

## Install

Installation of the [npm package](https://npmjs.org/package/@vates/read-chunk):

```sh
npm install --save @vates/read-chunk
```

## Usage

### `readChunk(stream, [size])`

- returns the next available chunk of data
- like `stream.read()`, a number of bytes can be specified
- returns with less data than expected if stream has ended
- returns `null` if the stream has ended and no data has been read

```js
import { readChunk } from '@vates/read-chunk'
;(async () => {
  let chunk
  while ((chunk = await readChunk(stream, 1024)) !== null) {
    // do something with chunk
  }
})()
```

### `readChunkStrict(stream, [size])`

Similar behavior to `readChunk` but throws if the stream ended before the requested data could be read.

```js
import { readChunkStrict } from '@vates/read-chunk'

const chunk = await readChunkStrict(stream, 1024)
```

### `skip(stream, size)`

Skips a given number of bytes from a stream.

Returns the number of bytes actually skipped, which may be less than the requested size if the stream has ended.

```js
import { skip } from '@vates/read-chunk'

const bytesSkipped = await skip(stream, 2 * 1024 * 1024 * 1024)
```

### `skipStrict(stream, size)`

Skips a given number of bytes from a stream and throws if the stream ended before enough stream has been skipped.

```js
import { skipStrict } from '@vates/read-chunk'

await skipStrict(stream, 2 * 1024 * 1024 * 1024)
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
