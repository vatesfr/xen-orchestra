<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @xen-orchestra/self-signed [![Build Status](https://travis-ci.org/vatesfr/xen-orchestra.png?branch=master)](https://travis-ci.org/vatesfr/xen-orchestra)

[![Package Version](https://badgen.net/npm/v/@xen-orchestra/self-signed)](https://npmjs.org/package/@xen-orchestra/self-signed) ![License](https://badgen.net/npm/license/@xen-orchestra/self-signed) [![PackagePhobia](https://badgen.net/packagephobia/install/@xen-orchestra/self-signed)](https://packagephobia.now.sh/result?p=@xen-orchestra/self-signed)

> Minimalist wrapper around openssl to generate a self signed certificate

## Install

Installation of the [npm package](https://npmjs.org/package/@xen-orchestra/self-signed):

```
> npm install --save @xen-orchestra/self-signed
```

## Usage

```js
import { genSelfSigned } from '@xen-orchestra/self-signed'

console.log(await genSelfSigned())
// {
//   cert: '-----BEGIN CERTIFICATE-----\n' +
//     // content…
//     '-----END CERTIFICATE-----\n',
//   key: '-----BEGIN RSA PRIVATE KEY-----\n' +
//     // content…
//     '-----END RSA PRIVATE KEY-----\n'
// }
```

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

[ISC](hhttps://spdx.org/licenses/ISC) © [Vates SAS](https://vates.fr)
