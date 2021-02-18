```js
import { decorateResult } from '@vates/decorate-result'

class Foo {
  @decorateResult(JSON.parse)
  bar() {
    // body
  }
}
```
