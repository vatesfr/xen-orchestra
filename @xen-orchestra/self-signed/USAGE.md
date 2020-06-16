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
