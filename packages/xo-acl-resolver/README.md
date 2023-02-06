<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# xo-acl-resolver

[![Package Version](https://badgen.net/npm/v/xo-acl-resolver)](https://npmjs.org/package/xo-acl-resolver) ![License](https://badgen.net/npm/license/xo-acl-resolver) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/xo-acl-resolver)](https://bundlephobia.com/result?p=xo-acl-resolver) [![Node compatibility](https://badgen.net/npm/node/xo-acl-resolver)](https://npmjs.org/package/xo-acl-resolver)

> Xen-Orchestra internal: do ACLs resolution

## Install

Installation of the [npm package](https://npmjs.org/package/xo-acl-resolver):

```sh
npm install --save xo-acl-resolver
```

## Usage

```js
import check from 'xo-acl-resolver'

// This object contains a list of permissions returned from
// xo-server's acl.getCurrentPermissions.
const permissions = {
  /* ... */
}

// This function should returns synchronously an object from an id.
const getObject = id => {
  /* ... */
}

// For a single object:
if (check(permissions, getObject, objectId, permission)) {
  console.log(`${permission} set for object ${objectId}`)
}

// For multiple objects/permissions:
if (
  check(permissions, getObject, [
    [object1Id, permission1],
    [object12d, permission2],
  ])
) {
  console.log('all permissions checked')
}
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
