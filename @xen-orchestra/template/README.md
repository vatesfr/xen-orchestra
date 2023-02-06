<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @xen-orchestra/template

[![Package Version](https://badgen.net/npm/v/@xen-orchestra/template)](https://npmjs.org/package/@xen-orchestra/template) ![License](https://badgen.net/npm/license/@xen-orchestra/template) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@xen-orchestra/template)](https://bundlephobia.com/result?p=@xen-orchestra/template) [![Node compatibility](https://badgen.net/npm/node/@xen-orchestra/template)](https://npmjs.org/package/@xen-orchestra/template)

## Install

Installation of the [npm package](https://npmjs.org/package/@xen-orchestra/template):

```sh
npm install --save @xen-orchestra/template
```

## Usage

Create a string replacer based on a pattern and a list of rules.

```js
const myReplacer = compileTemplate('{name}_COPY_{name}_{id}_%%', {
  '{name}': vm => vm.name_label,
  '{id}': vm => vm.id,
  '%': (_, i) => i,
})

const newString = myReplacer(
  {
    name_label: 'foo',
    id: 42,
  },
  32
)

newString === 'foo_COPY_{name}_42_32%' // true
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
