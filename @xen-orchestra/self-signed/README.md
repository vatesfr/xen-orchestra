<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @xen-orchestra/self-signed

[![Package Version](https://badgen.net/npm/v/@xen-orchestra/self-signed)](https://npmjs.org/package/@xen-orchestra/self-signed) ![License](https://badgen.net/npm/license/@xen-orchestra/self-signed) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@xen-orchestra/self-signed)](https://bundlephobia.com/result?p=@xen-orchestra/self-signed) [![Node compatibility](https://badgen.net/npm/node/@xen-orchestra/self-signed)](https://npmjs.org/package/@xen-orchestra/self-signed)

> Minimalist wrapper around openssl to generate a self signed certificate

## Install

Installation of the [npm package](https://npmjs.org/package/@xen-orchestra/self-signed):

```sh
npm install --save @xen-orchestra/self-signed
```

## Usage

### `genSelfSigned()`

> Generate a self-signed cert/key pair with OpenSSL.

```js
import { genSelfSigned } from '@xen-orchestra/self-signed'

console.log(
  await genSelfSigned({
    // Number of days this certificate will be valid.
    //
    // Default: 360
    days: 600,
  })
)
// {
//   cert: '-----BEGIN CERTIFICATE-----\n' +
//     // content…
//     '-----END CERTIFICATE-----\n',
//   key: '-----BEGIN RSA PRIVATE KEY-----\n' +
//     // content…
//     '-----END RSA PRIVATE KEY-----\n'
// }
```

### `readCert()`

> Reads a cert/key pair from the filesystem, if missing or invalid, generates a new one and write them to the filesystem.

```js
import { readCert } from '@xen-orchestra/self-signed/readCert'

const { cert, key } = await readCert('path/to/cert.pem', 'path/to/key.pem', {
  // if false, do not generate a new one in case of error
  autoCert: false,

  // this function is called in case a new pair is generated
  info: console.log,

  // mode used when creating files or directories after generating a new pair
  mode: 0o400,

  // this function is called when there is a non fatal error (fatal errors are thrown)
  warn: console.warn,
})

// unfortunately some cert/key issues are detected only when attempting to use them
//
// that's why you can pass a `use` function to `readCert` that will received the pair
// and in case some specific errors are thrown, it will trigger a new generation
await readCert('path/to/cert.pem', 'path/to/key.pem', {
  autoCert: true,

  async use({ cert, key }) {
    const server = https.createServer({ cert, key })

    await new Promise((resolve, reject) => {
      server.once('error', reject).listen(443, resolve)
    })
  },
})
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
