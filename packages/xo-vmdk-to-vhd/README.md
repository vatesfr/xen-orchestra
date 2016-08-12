# xo-vmdk-to-vhd
[![Build Status](https://travis-ci.org/vatesfr/xo-vmdk-to-vhd.svg?branch=master)](https://travis-ci.org/vatesfr/xo-vmdk-to-vhd)
JS lib streaming a vmdk file to a vhd

To install: 

```
$ npm install xo-vmdk-to-vhd
```

To convert a VMDK stream to a Fixed VHD stream without buffering the entire input or output:
```
import convertFromVMDK from 'xo-vmdk-to-vhd'
import {createReadStream, createWriteStream} from 'fs-promise'

const pipe = (await convertFromVMDK(fs.createReadStream(vmdkFileName))).pipe(fs.createWriteStream(vhdFileName))
    await new Promise((resolve, reject) => {
      pipe.on('finish', resolve)
      pipe.on('error', reject)
    })
```

or:

```
var converter =  require('xo-vmdk-to-vhd').default;

var fs = require('fs-promise')
var p = converter(fs.createReadStream(vmdkFileName));
p.then(function(stream) {
    var pipe = stream.pipe(fs.createWriteStream(vhdFileName));
    return new Promise(function(resolve, reject) {
        pipe.on('finish', resolve)
      	pipe.on('error', reject)
    });
});
```
