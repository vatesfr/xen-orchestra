# xo-vmdk-to-vhd [![Build Status](https://travis-ci.org/vatesfr/xen-orchestra.png?branch=master)](https://travis-ci.org/vatesfr/xen-orchestra)

> JS lib streaming a vmdk file to a vhd.

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

```
# Install dependencies
> npm install

# Run the tests
> npm test

# Continuously compile
> npm run dev

# Continuously run the tests
> npm run dev-test

# Build for production (automatically called by npm install)
> npm run build
```

## Contributions

Contributions are *very* welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues/)
  you've encountered;
- fork and create a pull request.

## License

AGPLv3.0 © [Vates SAS](https://vates.fr)
