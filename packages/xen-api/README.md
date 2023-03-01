<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# xen-api

[![Package Version](https://badgen.net/npm/v/xen-api)](https://npmjs.org/package/xen-api) ![License](https://badgen.net/npm/license/xen-api) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/xen-api)](https://bundlephobia.com/result?p=xen-api) [![Node compatibility](https://badgen.net/npm/node/xen-api)](https://npmjs.org/package/xen-api)

> Connector to the Xen API

## Install

Installation of the [npm package](https://npmjs.org/package/xen-api):

```sh
npm install --save xen-api
```

## Usage

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

### Library

```javascript
const { createClient } = require('xen-api')

const xapi = createClient({
  url: 'https://xen1.company.net',
  allowUnauthorized: false,
  auth: {
    user: 'root',
    password: 'important secret password',
  },
  readOnly: false,
})
```

Options:

- `url`: address of a host in the pool we are trying to connect to
- `allowUnauthorized`: whether to accept self-signed certificates
- `auth`: credentials used to sign in (can also be specified in the URL)
- `readOnly = false`: if true, no methods with side-effects can be called
- `callTimeout`: number of milliseconds after which a call is considered failed (can also be a map of timeouts by methods)
- `httpProxy`: URL of the HTTP/HTTPS proxy used to reach the host, can include credentials

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
> xen-api xen1.company.net root
Password: ******
root@xen1.company.net> xapi.status
'connected'
root@xen1.company.net> xapi.pool.master
'OpaqueRef:ec7c5147-8aee-990f-c70b-0de916a8e993'
root@xen1.company.net> xapi.pool.$master.name_label
'xen1'
```

You can optionally prefix the address by a protocol: `https://` (default) or `http://`.

In case of error due to invalid or self-signed certificates you can use the `--allow-unauthorized` flag (or `--au`):

```
> xen-api --au xen1.company.net root
```

To ease searches, `find()` and `findAll()` functions are available:

```
root@xen1.company.net> findAll({ $type: 'VM' }).length
183
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
