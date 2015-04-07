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

**Inserting a new entry**

```javascript
col.add('foo', true)
```

**Updating an existing entry**

```javascript
col.update('foo', false)
```

**Inserting or updating an entry**

```javascript
col.set('bar', true)
```

**Notifying an external update**

> If an entry is an object, it can be updated directly without using
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

> Because this is a much used pattern, `touch` returns the entry to
> allow its direct modification.

```javascript
col.touch('baz').prop = false
```

**Removing an existing entry**

```javascript
col.unset('bar')
```

**Removing all entries**

```javascript
col.clear()
```

### Query

**Checking the existence of an entry**

```javascript
var hasBar = col.has('bar')
```

**Getting an existing entry**

```javascript
var foo = col.get('foo')

// The second parameter can be used to specify a fallback in case the
// entry does not exist.
var bar = col.get('bar', 6.28)
```

**Getting the number of entries**

```javascript
var size = col.size
```

### Events

> The events are emitted asynchronously (at the next turn/tick of the
> event loop) and are deduplicated which means, for instance, that an
> addition followed by an update will result only in a single
> addition.

**New entries**

```javascript
col.on('add', (added) => {
  forEach(added, (value, key) => {
    console.log('+ %s: %j', key, value)
  })
})
```

**Updated entries**

```javascript
col.on('update', (updated) => {
  forEach(updated, (value, key) => {
    console.log('- %s: %j', key, value)
  })
})
```

**Removed entries**

```javascript
col.on('remove', (removed) => {
  // For consistency, `removed` is also a map but contrary to `ædded`
  // and `updated`, the values associated to the keys are not
  // significant since the entries have already be removed.

  forEach(removed, (value, key) => {
    console.log('± %s', key)
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
