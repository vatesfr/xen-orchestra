# xo-acl-resolver [![Build Status](https://travis-ci.org/vatesfr/xo-acl-resolver.png?branch=master)](https://travis-ci.org/vatesfr/xo-acl-resolver)

> [Xen-Orchestra](http://xen-orchestra.com/) internal: do ACLs resolution.

## Install

Installation of the [npm package](https://npmjs.org/package/xo-acl-resolver):

```
> npm install --save xo-acl-resolver
```

## Usage

```js
import check from 'xo-acl-resolver'

// This object contains a list of permissions returned from
// xo-server's acl.getCurrentPermissions.
const permissions = { /* ... */ }

// This function should returns synchronously an object from an id.
const getObject = id => { /* ... */ }

// For a single object:
if (check(permissions, getObject, objectId, permission)) {
  console.log(`${permission} set for object ${objectId}`)
}

// For multiple objects/permissions:
if (check(permissions, getObject, [
  [ object1Id, permission1 ],
  [ object12d, permission2 ],
])) {
  console.log('all permissions checked')
}
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

- report any [issue](https://github.com/vatesfr/xo-acl-resolver/issues)
  you've encountered;
- fork and create a pull request.

## License

ISC © [Vates SAS](https://vates.fr)
