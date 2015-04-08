# collection [![Build Status](https://travis-ci.org/marsaud/collection.png?branch=master)](https://travis-ci.org/marsaud/collection)

> Generic in-memory collection with events

## Install

Installation of the [npm package](https://npmjs.org/package/collection):

```
> npm install --save collection
```

## Usage

```javascript
var Collection = require('collection')
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

**Updating an existing item**

```javascript
col.update('foo', false)
```

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

**Removing an existing item**

```javascript
col.remove('bar')
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
col.on('add', (added) => {
  forEach(added, (value, key) => {
    console.log('+ %s: %j', key, value)
  })
})
```

**Updated items**

```javascript
col.on('update', (updated) => {
  forEach(updated, (value, key) => {
    console.log('± %s: %j', key, value)
  })
})
```

**Removed items**

```javascript
col.on('remove', (removed) => {
  // For consistency, `removed` is also a map but contrary to `added`
  // and `updated`, the values associated to the keys are not
  // significant since the items have already be removed.

  forEach(removed, (value, key) => {
    console.log('- %s', key)
  })
})
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

- report any [issue](https://github.com/marsaud/collection/issues)
  you've encountered;
- fork and create a pull request.

## License

ISC © [Vates SAS](http://vates.fr)
