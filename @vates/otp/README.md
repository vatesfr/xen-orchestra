<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @vates/otp

[![Package Version](https://badgen.net/npm/v/@vates/otp)](https://npmjs.org/package/@vates/otp) ![License](https://badgen.net/npm/license/@vates/otp) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@vates/otp)](https://bundlephobia.com/result?p=@vates/otp) [![Node compatibility](https://badgen.net/npm/node/@vates/otp)](https://npmjs.org/package/@vates/otp)

> Minimal HTOP/TOTP implementation

## Install

Installation of the [npm package](https://npmjs.org/package/@vates/otp):

```sh
npm install --save @vates/otp
```

## Usage

### Usual workflow

> This section presents how this library should be used to implement a classic two factor authentication.

#### Setup

```js
import { generateSecret, generateTotp } from '@vates/otp'
import QrCode from 'qrcode'

// Generates a secret that will be shared by both the service and the user:
const secret = generateSecret()

// Stores the secret in the service:
await currentUser.saveOtpSecret(secret)

// Generates an URI to present to the user
const uri = generateTotpUri({ secret })

// Generates the QR code from the URI to make it easily importable in Authy or Google Authenticator
const qr = await QrCode.toDataURL(uri)
```

#### Authentication

```js
import { verifyTotp } from '@vates/otp'

// Verifies a `token` entered by the user against a `secret` generated during setup.
if (await verifyTotp(token, { secret })) {
  console.log('authenticated!')
}
```

### API

#### Secret

```js
import { generateSecret } from '@vates/otp'

const secret = generateSecret()
// 'OJOKA65RY5FQQ2RYWVKD5Y3YG5CSHGYH'
```

#### HOTP

> This is likely not what you want to use, see TOTP below instead.

```js
import { generateHotp, generateHotpUri, verifyHotp } from '@vates/otp'

// a sequence number, see HOTP specification
const counter = 0

// generate a token
//
// optional params:
// - digits
const token = await generateHotp({ counter, secret })
// '239988'

// verify a token
//
// optional params:
// - digits
const isValid = await verifyHotp(token, { counter, secret })
// true

// generate a URI than can be displayed as a QR code to be used with Authy or Google Authenticator
//
// optional params:
// - digits
const uri = generateHotpUri({ counter, label: 'account name', issuer: 'my app', secret })
// 'otpauth://hotp/my%20app:account%20name?counter=0&issuer=my%20app&secret=OJOKA65RY5FQQ2RYWVKD5Y3YG5CSHGYH'
```

Optional params and their default values:

- `digits = 6`: length of the token, avoid using it because not compatible with Google Authenticator

#### TOTP

```js
import { generateTotp, generateTotpUri, verifyTotp } from '@vates/otp'

// generate a token
//
// optional params:
// - digits
// - period
// - timestamp
const token = await generateTotp({ secret })
// '632869'

// verify a token
//
// optional params:
// - digits
// - period
// - timestamp
// - window
const isValid = await verifyTotp(token, { secret })
// true

// generate a URI than can be displayed as a QR code to be used with Authy or Google Authenticator
//
// optional params:
// - digits
// - period
const uri = generateTotpUri({ label: 'account name', issuer: 'my app', secret })
// 'otpauth://totp/my%20app:account%20name?issuer=my%20app&secret=OJOKA65RY5FQQ2RYWVKD5Y3YG5CSHGYH'
```

Optional params and their default values:

- `digits = 6`: length of the token, avoid using it because not compatible with Google Authenticator
- `period = 30`: number of seconds a token is valid
- `timestamp = Date.now() / 1e3`: Unix timestamp, in seconds, when this token will be valid, default to now
- `window = 1`: number of periods before and after `timestamp` for which the token is considered valid

#### Verification from URI

```js
import { verifyFromUri } from '@vates/otp'

// Verify the token using all the information contained in the URI
const isValid = await verifyFromUri(token, uri)
// true
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
