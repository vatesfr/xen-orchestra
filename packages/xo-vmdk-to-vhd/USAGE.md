To convert a VMDK stream to a Fixed VHD stream without buffering the entire input or output:

```js
import { vmdkToVhd } from 'xo-vmdk-to-vhd'
import { createReadStream, createWriteStream } from 'fs'
;(async () => {
  const stream = await vmdkToVhd(fs.createReadStream(vmdkFileName))

  stream.pipe(fs.createWriteStream(vhdFileName))
})()
```

or:

```js
var vmdkToVhd = require('xo-vmdk-to-vhd').vmdkToVhd
var createReadStream = require('fs').createReadStream
var createWriteStream = require('fs').createWriteStream

vmdkToVhd(fs.createReadStream(vmdkFileName)).then(function (stream) {
  stream.pipe(fs.createWriteStream(vhdFileName))
})
```
