<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @xen-orchestra/mixin

[![Package Version](https://badgen.net/npm/v/@xen-orchestra/mixin)](https://npmjs.org/package/@xen-orchestra/mixin) ![License](https://badgen.net/npm/license/@xen-orchestra/mixin) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@xen-orchestra/mixin)](https://bundlephobia.com/result?p=@xen-orchestra/mixin) [![Node compatibility](https://badgen.net/npm/node/@xen-orchestra/mixin)](https://npmjs.org/package/@xen-orchestra/mixin)

## Install

Installation of the [npm package](https://npmjs.org/package/@xen-orchestra/mixin):

```sh
npm install --save @xen-orchestra/mixin
```

## Usage

- mixins can depend on each other, they will be instanciated on-demand

```js
import mixin from '@xen-orchestra/mixin'

class MyMixin {
  constructor(app, ...mixinParams) {}

  foo() {}
}

class App {
  constructor() {
    mixin(this, { MyMixin }, [...mixinParams])
  }
}

app = new App()
app.myMixin.foo()
```

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

[ISC](https://spdx.org/licenses/ISC) © [Vates SAS](https://vates.fr)
