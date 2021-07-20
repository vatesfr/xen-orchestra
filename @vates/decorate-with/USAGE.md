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

### `decorateMethodsWith(class, map)`

Decorates a number of methods directly, without using the decorator syntax:

```js
import { decorateMethodsWith } from '@vates/decorate-with'

class Foo {
  bar() {
    // body
  }

  baz() {
    // body
  }
}

decorateMethodsWith(Foo, {
  // without arguments
  bar: lodash.curry,

  // with arguments
  baz: [lodash.debounce, 150],
})
```

The decorated class is returned, so you can export it directly.
