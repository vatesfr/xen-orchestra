# xo-vmdk-to-vhd [![Build Status](https://travis-ci.org/vatesfr/xo-vmdk-to-vhd.png?branch=master)](https://travis-ci.org/vatesfr/xo-vmdk-to-vhd)

> JS lib streaming a vmdk file to a vhd

## Install

Installation of the [npm package](https://npmjs.org/package/xo-vmdk-to-vhd):

```
> npm install --save xo-vmdk-to-vhd
```

## Usage

To convert a VMDK stream to a Fixed VHD stream without buffering the entire input or output:

```js
import convertFromVMDK from 'xo-vmdk-to-vhd'
import {createReadStream, createWriteStream} from 'fs'

(async () => {
  const stream = await convertFromVMDK(fs.createReadStream(vmdkFileName))

  stream.pipe(fs.createWriteStream(vhdFileName))
})()
```

or:

```js
var convertFromVMDK = require('xo-vmdk-to-vhd').default
var createReadStream = require('fs').createReadStream
var createWriteStream = require('fs').createWriteStream

convertFromVMDK(fs.createReadStream(vmdkFileName)).then(function (stream) {
  stream.pipe(fs.createWriteStream(vhdFileName))
})
```

## Development

### Installing dependencies

```
> npm install
```

### Compilation

The sources files are watched and automatically recompiled on changes.

```
> npm run dev
```

### Tests

```
> npm run test-dev
```

## Contributions

Contributions are *very* welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xo-vmdk-to-vhd/issues/)
  you've encountered;
- fork and create a pull request.

## License

AGPLv3.0 © [Vates SAS](https://vates.fr)
