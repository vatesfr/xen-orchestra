<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @vates/decorate-with

[![Package Version](https://badgen.net/npm/v/@vates/decorate-with)](https://npmjs.org/package/@vates/decorate-with) ![License](https://badgen.net/npm/license/@vates/decorate-with) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@vates/decorate-with)](https://bundlephobia.com/result?p=@vates/decorate-with) [![Node compatibility](https://badgen.net/npm/node/@vates/decorate-with)](https://npmjs.org/package/@vates/decorate-with)

> Creates a decorator from a function wrapper

## Install

Installation of the [npm package](https://npmjs.org/package/@vates/decorate-with):

```sh
npm install --save @vates/decorate-with
```

## Usage

### `decorateWith(fn, ...args)`

Creates a new ([legacy](https://babeljs.io/docs/en/babel-plugin-syntax-decorators#legacy)) method decorator from a function decorator, for instance, allows using Lodash's functions as decorators:

```js
import { decorateWith } from '@vates/decorate-with'

class Foo {
  @decorateWith(lodash.debounce, 150)
  bar() {
    // body
  }
}
```

### `decorateClass(class, map)`

Decorates a number of accessors and methods directly, without using the decorator syntax:

```js
import { decorateClass } from '@vates/decorate-with'

class Foo {
  get bar() {
    // body
  }

  set bar(value) {
    // body
  }

  baz() {
    // body
  }
}

decorateClass(Foo, {
  // getter and/or setter
  bar: {
    // without arguments
    get: lodash.memoize,

    // with arguments
    set: [lodash.debounce, 150],
  },

  // method (with or without arguments)
  baz: lodash.curry,
})
```

The decorated class is returned, so you can export it directly.

To apply multiple transforms to an accessor/method, you can either call `decorateClass` multiple times or use [`@vates/compose`](https://www.npmjs.com/package/@vates/compose):

```js
decorateClass(Foo, {
  baz: compose([
    [lodash.debounce, 150]
    lodash.curry,
  ])
})
```

### `perInstance(fn, ...args)`

Helper to decorate the method by instance instead of for the whole class.

This is often necessary for caching or deduplicating calls.

```js
import { perInstance } from '@vates/decorateWith'

class Foo {
  @decorateWith(perInstance, lodash.memoize)
  bar() {
    // body
  }
}
```

Because it's a normal function, it can also be used with `decorateClass`, with `compose` or even by itself.

### `decorateMethodsWith(class, map)`

> Deprecated alias for [`decorateClass(class, map)`](#decorateclassclass-map).

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

[ISC](https://spdx.org/licenses/ISC) © [Vates SAS](https://vates.fr)
