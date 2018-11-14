# xen-api [![Build Status](https://travis-ci.org/vatesfr/xen-orchestra.png?branch=master)](https://travis-ci.org/vatesfr/xen-orchestra)

> Connector to the Xen API

Tested with:

- XenServer 7.6
- XenServer 7.5
- XenServer 7.4
- XenServer 7.3
- XenServer 7.2
- XenServer 7.1
- XenServer 7
- XenServer 6.5
- XenServer 6.2
- XenServer 5.6

## Install

Installation of the [npm package](https://npmjs.org/package/xen-api):

```
> npm install --save xen-api
```

## Usage

### Library

```javascript
const { createClient } = require('xen-api')

const xapi = createClient({
  url: 'https://xen1.company.net',
  allowUnauthorized: false,
  auth: {
    user: 'root',
    password: 'important secret password'
  },
  readOnly: false
})
```

Options:

- `url`: address of a host in the pool we are trying to connect to
- `allowUnauthorized`: whether to accept self-signed certificates
- `auth`: credentials used to sign in (can also be specified in the URL)
- `readOnly = false`: if true, no methods with side-effects can be called

```js
// Force connection.
xapi.connect().catch(error => {
  console.error(error)
})

// Watch objects.
xapi.objects.on('add', objects => {
  console.log('new objects:', objects)
})
```

> Note: all objects are frozen and cannot be altered!

Custom fields on objects (hidden − ie. non enumerable):
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

To ease searches, `find()` and `findAll()` functions are available:

```
root@xen1.company.net> findAll({ $type: 'vm' }).length
183
```

## Development

```
# Install dependencies
> npm install

# Run the tests
> npm test

# Continuously compile
> npm run dev

# Continuously run the tests
> npm run dev-test

# Build for production (automatically called by npm install)
> npm run build
```

## Contributions

Contributions are *very* welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/xen-api/issues)
  you've encountered;
- fork and create a pull request.

## License

ISC © [Julien Fontanet](https://github.com/julien-f)
