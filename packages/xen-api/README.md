# xen-api [![Build Status](https://travis-ci.org/julien-f/js-xen-api.png?branch=master)](https://travis-ci.org/julien-f/js-xen-api)

> Connector to the Xen API

Tested with:

- Xen Server 5.6
- Xen Server 6.2
- Xen Server 6.5

## Install

Installation of the [npm package](https://npmjs.org/package/xen-api):

```
> npm install --save xen-api
```

## Usage

### Library

```javascript
var createClient = require('xen-api').createClient

var xapi = createClient({
  url: 'https://xen1.company.net',
  auth: {
    user: 'root',
    password: 'important secret password'
  },
  readOnly: false
})
```

Options:

- `url`: address of a host in the pool we are trying to connect to
- `auth`: credentials used to sign in
- `readOnly = false`: if true, no methods with side-effects can be called

```js
// Force connection.
xapi.connect().catch(error => {
  console.error(error)
})

// Watch objects.
xapi.objects.on('add', function (objects) {
  console.log('new objects:', objects)
})
```

Custom fields on objects (hidden and read-only):
- `$type`: the type of the object (`VM`, `task`, …);
- `$ref`: the (opaque) reference of the object;
- `$id`: the identifier of this object (its UUID if any, otherwise its reference);
- `$pool`: the pool object this object belongs to.

Furthermore, any field containing a reference (or references if an
array) can be resolved by prepending the field name with a `$`:

```javascript
console.log(xapi.pool.$master.$resident_VMs[0].name_label)
// vm1
```

### CLI

A CLI is provided to help exploration and discovery of the XAPI.

```
> xen-api https://xen1.company.net root
Password: ******
root@xen1.company.net> xapi.status
'connected'
root@xen1.company.net> xapi.pool.master
'OpaqueRef:ec7c5147-8aee-990f-c70b-0de916a8e993'
root@xen1.company.net> xapi.pool.$master.name_label
'xen1'
```

## Development

### Installing dependencies

```
> npm install
```

### Compilation

The sources files are watched and automatically recompiled on changes.

```
> npm run dev
```

### Tests

```
> npm run test-dev
```

## Contributions

Contributions are *very* welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/julien-f/js-xen-api/issues)
  you've encountered;
- fork and create a pull request.

## License

ISC © [Julien Fontanet](https://github.com/julien-f)
