<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# xo-collection

[![Package Version](https://badgen.net/npm/v/xo-collection)](https://npmjs.org/package/xo-collection) ![License](https://badgen.net/npm/license/xo-collection) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/xo-collection)](https://bundlephobia.com/result?p=xo-collection) [![Node compatibility](https://badgen.net/npm/node/xo-collection)](https://npmjs.org/package/xo-collection)

> Generic in-memory collection with events

## Install

Installation of the [npm package](https://npmjs.org/package/xo-collection):

```sh
npm install --save xo-collection
```

## Usage

```javascript
var { Collection } = require('xo-collection')
```

### Creation

```javascript
// Creates a new collection.
var col = new Collection()
```

### Manipulation

**Inserting a new item**

```javascript
col.add('foo', true)
```

- **Throws** `DuplicateItem` if the item is already in the collection.

**Updating an existing item**

```javascript
col.update('foo', false)
```

- **Throws** `NoSuchItem` if the item is not in the collection.

**Inserting or updating an item**

```javascript
col.set('bar', true)
```

**Notifying an external update**

> If an item is an object, it can be updated directly without using
> the `set`/`update` methods.
>
> To make sure the collection stays in sync and the correct events are
> sent, the `touch` method can be used to notify the change.

```javascript
var baz = {}

col.add('baz', baz)

baz.prop = true
col.touch('baz')
```

> Because this is a much used pattern, `touch` returns the item to
> allow its direct modification.

```javascript
col.touch('baz').prop = false
```

- **Throws** `NoSuchItem` if the item is not in the collection.
- **Throws** `IllegalTouch` if the item is not an object.

**Removing an existing item**

```javascript
col.remove('bar')
```

- **Throws** `NoSuchItem` if the item is not in the collection.

**Removing an item without error**

This is the symmetric method of `set()`: it removes the item if it
exists otherwise does nothing.

```javascript
col.unset('bar')
```

**Removing all items**

```javascript
col.clear()
```

### Query

**Checking the existence of an item**

```javascript
var hasBar = col.has('bar')
```

**Getting an existing item**

```javascript
var foo = col.get('foo')

// The second parameter can be used to specify a fallback in case the
// item does not exist.
var bar = col.get('bar', 6.28)
```

- **Throws** `NoSuchItem` if the item is not in the collection and no
  fallback has been passed.

**Getting a read-only view of the collection**

> This property is useful for example to iterate over the collection
> or to make advanced queries with the help of utility libraries such
> as lodash.

```javascript
var _ = require('lodash')

// Prints all the items.
_.forEach(col.all, function (value, key) {
  console.log('- %s: %j', key, value)
})

// Finds all the items which are objects and have a property
// `active` which equals `true`.
var results = _.where(col.all, { active: true })
```

**Getting the number of items**

```javascript
var size = col.size
```

### Events

> The events are emitted asynchronously (at the next turn/tick of the
> event loop) and are deduplicated which means, for instance, that an
> addition followed by an update will result only in a single
> addition.

**New items**

```javascript
col.on('add', added => {
  forEach(added, (value, key) => {
    console.log('+ %s: %j', key, value)
  })
})
```

**Updated items**

```javascript
col.on('update', updated => {
  forEach(updated, (value, key) => {
    console.log('± %s: %j', key, value)
  })
})
```

**Removed items**

```javascript
col.on('remove', removed => {
  // For consistency, `removed` is also a map but contrary to `added`
  // and `updated`, the values associated to the keys are not
  // significant since the items have already be removed.

  forEach(removed, (value, key) => {
    console.log('- %s', key)
  })
})
```

**End of update**

> Emitted when all the update process is finished and all the update
> events has been emitted.

```javascript
col.on('finish', () => {
  console.log('the collection has been updated')
})
```

### Iteration

```javascript
for (const [key, value] of col) {
  console.log('- %s: %j', key, value)
}

for (const key of col.keys()) {
  console.log('- %s', key)
}

for (const value of col.values()) {
  console.log('- %j', value)
}
```

### Views

```javascript
const { View } = require('xo-collection/view')
```

> A view is a read-only collection which contains only the items of a
> parent collection which satisfy a predicate.
>
> It is updated at most once per turn of the event loop and therefore
> can be briefly invalid.

```javascript
const myView = new View(parentCollection, function predicate(value, key) {
  // This function should return a boolean indicating whether the
  // current item should be in this view.
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
