# xen-api [![Build Status](https://travis-ci.org/js-xen-api.png?branch=master)](https://travis-ci.org/js-xen-api)

> Connector to the Xen API

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
  }
})

// Force connection.
xapi.connect().catch(error => {
  console.error(error)
})

// Watch objects.
xapi.objects.on('add', function (objects) {
  console.log('new objects:', objects)
})
```

### CLI

A CLI is provided to help exploration and discovery of the XAPI.

```
> xen-api https://xen1.company.net root
Password: ******
root@xen1.company.net> xapi.status
'connected'
root@xen1.company.net> xapi.pool.master.name_label
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
