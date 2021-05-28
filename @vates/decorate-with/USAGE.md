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
