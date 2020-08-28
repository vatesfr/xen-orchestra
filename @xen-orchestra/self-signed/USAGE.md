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
