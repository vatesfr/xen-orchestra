<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @xen-orchestra/vmdk

[![Package Version](https://badgen.net/npm/v/@xen-orchestra/vmdk)](https://npmjs.org/package/@xen-orchestra/vmdk) ![License](https://badgen.net/npm/license/@xen-orchestra/vmdk) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@xen-orchestra/vmdk)](https://bundlephobia.com/result?p=@xen-orchestra/vmdk) [![Node compatibility](https://badgen.net/npm/node/@xen-orchestra/vmdk)](https://npmjs.org/package/@xen-orchestra/vmdk)

> parse and produce vmdk files

## Install

Installation of the [npm package](https://npmjs.org/package/@xen-orchestra/vmdk):

```sh
npm install --save @xen-orchestra/vmdk
```

## Usage

Generate a stream optimized VMDK from any `Disk` of `@xen-orchestra/disk-transform`:

```js
import { toVmdkStream } from '@xen-orchestra/vmdk'

const stream = await toVmdkStream(disk, { diskName: 'my-disk.vmdk' })
```

By default the grain directory and the grain tables are written after the data, like any stream
optimized disk: nothing is padded, and the size of the output is only known once it has been fully
generated, so `stream.length` is left undefined.

With the `seekable` layout, the tables are written first and every grain gets a slot of a fixed
size. The file can then be read back with random access — or as a stream, since all its metadata
comes before its data — and `stream.length` is the exact size of the output, which an HTTP export or
a tar entry needs in advance. It weights the uncompressed size of the allocated grains, plus 0.78%:

```js
const stream = await toVmdkStream(disk, { layout: 'seekable' })
console.log(stream.length) // exact size of the file
```

The format itself, and the reading side to come, are described in [docs/vmdk.md](./docs/vmdk.md).

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

[ISC](https://spdx.org/licenses/ISC) © [Vates SAS](https://vates.fr)
