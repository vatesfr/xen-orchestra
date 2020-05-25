# @xen-orchestra/self-signed

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

ISC © [Vates SAS](https://vates.fr)
