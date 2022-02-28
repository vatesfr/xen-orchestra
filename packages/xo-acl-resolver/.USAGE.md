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
