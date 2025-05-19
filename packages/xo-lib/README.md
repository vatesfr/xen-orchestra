<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# xo-lib

[![Package Version](https://badgen.net/npm/v/xo-lib)](https://npmjs.org/package/xo-lib) ![License](https://badgen.net/npm/license/xo-lib) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/xo-lib)](https://bundlephobia.com/result?p=xo-lib) [![Node compatibility](https://badgen.net/npm/node/xo-lib)](https://npmjs.org/package/xo-lib)

> Library to connect to XO-Server

## Install

Installation of the [npm package](https://npmjs.org/package/xo-lib):

```sh
npm install --save xo-lib
```

## Usage

> If the URL is not provided and the current environment is a web
> browser, the location of the current page will be used.

```javascript
import Xo from 'xo-lib'

// Connect to XO.
const xo = new Xo({ url: 'https://xo.company.tld' })

// Let's start by opening the connection.
await xo.open()

// Must sign in before being able to call any methods (all calls will
// be buffered until signed in).
await xo.signIn({
  email: 'admin@admin.net',
  password: 'admin',
})

console('signed as', xo.user)
```

The credentials can also be passed directly to the constructor:

```javascript
const xo = Xo({
  url: 'https://xo.company.tld',
  credentials: {
    email: 'admin@admin.net',
    password: 'admin',
  },
})

xo.open()

xo.on('authenticated', () => {
  console.log(xo.user)
})
```

> If the URL is not provided and the current environment is a web
> browser, the location of the current page will be used.

### Connection

```javascript
await xo.open()

console.log('connected')
```

### Disconnection

```javascript
xo.close()

console.log('disconnected')
```

### Method call

```javascript
const token = await xo.call('token.create')

console.log('Token created', token)
```

### Status

The connection status is available through the status property which
is _open_, _connecting_ or _closed_.

```javascript
console.log('%s to xo-server', xo.status)
```

### Current user

Information about the user account used to sign in is available
through the `user` property.

```javascript
console.log('Current user is', xo.user)
```

> This property is null when the status is not connected.

### Events

```javascript
xo.on('open', () => {
  console.log('connected')
})
```

```javascript
xo.on('closed', () => {
  console.log('disconnected')
})
```

```javascript
xo.on('notification', function (notice) {
  console.log('notification:', notice.method, notice.params)
})
```

```javascript
xo.on('authenticated', () => {
  console.log('authenticated as', xo.user)
})

xo.on('authenticationFailure', () => {
  console.log('failed to authenticate')
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

[AGPL-3.0-or-later](https://spdx.org/licenses/AGPL-3.0-or-later) © [Vates SAS](https://vates.fr)
