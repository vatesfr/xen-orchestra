# xo-lib

[![Build Status](https://img.shields.io/travis/vatesfr/xo-lib/master.svg)](http://travis-ci.org/vatesfr/xo-lib)
[![Dependency Status](https://david-dm.org/vatesfr/xo-lib/status.svg?theme=shields.io)](https://david-dm.org/vatesfr/xo-lib)
[![devDependency Status](https://david-dm.org/vatesfr/xo-lib/dev-status.svg?theme=shields.io)](https://david-dm.org/vatesfr/xo-lib#info=devDependencies)

> Library to connect to XO-Server.

## Installation

### Node & Browserify

Installation of the [npm package](https://npmjs.org/package/xo-lib):

```
npm install --save xo-lib
```

Then require the package:

```javascript
var xoLib = require('xo-lib');
```

## High level API

This high-level interface handles session sign-in and a cache of
remote XO objects. It also automatically reconnect and retry method
calls when necessary.

```javascript
// Connect to XO.
var xo = new xoLib.Xo('https://xo.company.tld');

// Must sign in before being able to call any methods (all calls will
// be buffered until signed in).
xo.signIn({
  email: 'admin@admin.net',
  password: 'admin',
}).then(function () {
  console('signed as', xo.user);
});
```

The credentials can also be passed directly to the constructor:

```javascript
var xo = new xoLib.Xo({
  url: 'https://xo.company.tld',
  credentials: {
    email: 'admin@admin.net',
    password: 'admin',
  }
});
```

> If the URL is not provided and the current environment is a web
> browser, the location of the current page will be used.

### Method call

```javascript
xo.call('token.create').then(function (token) {
  console.log('Token created', token);
});
```

### Status

The connection status is available through the status property which
is *disconnected*, *connecting* or *connected*.

```javascript
console.log('%s to xo-server', xo.status);
```

### Current user

Information about the user account used to sign in is available
through the `user` property.

```javascript
console.log('Current user is', xo.user);
```

> This property is null when the status is not connected.


### XO Objects

XO objects are cached locally in the `objects` collection.

```javascript
// Read-only dictionary of all objects.
var allObjects = xo.objects.all;

// Looks up a given object by its identifier.
var object = allObjects[id];

// Read-only dictionary of all indexes.
var indexes = xo.objects.indexes;

// Read-only dictionary of types.
var byTypes = indexes.type;

// Read-only view of all VMs.
var vms = byTypes.VM;
```

Available indexes are: `ref`, `type` and `UUID`.

## Low level

```javascript
var api = new xoLib.Api('https://xo.company.tld');
```

> If the URL is not provided and the current environment is a web
> browser, the location of the current page will be used.

### Connection

```javascript
api.connect().then(function () {
  console.log('connected');
});
```

### Disconnection

```javascript
api.close();
```

### Method call

```javascript
api.call('session.signInWithPassword', {
  email: 'admin@admin.net',
  password: 'admin',
}).then(function (user) {
  console.log('Connected as', user);
});
```

> A method call automatically trigger a connection if necessary.

### Events

```javascript
api.on('connected', function () {
  console.log('connected');
});
```

```javascript
api.on('disconnected', function () {
  console.log('disconnected');
});
```

```javascript
api.on('notification', function (notif) {
  console.log('notification:', notif.method, notif.params);
});
```

## Contributions

Contributions are *very* welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xo-lib/issues)
  you've encountered;
- fork and create a pull request.

## License

ISC © [Vates SAS](http://vates.fr)
