# @xen-orchestra/template [![Build Status](https://travis-ci.org/vatesfr/xen-orchestra.png?branch=master)](https://travis-ci.org/vatesfr/xen-orchestra)

## Install

Installation of the [npm package](https://npmjs.org/package/@xen-orchestra/template):

```
> npm install --save @xen-orchestra/template
```

## Usage

Create a string replacer based on a pattern and a list of rules.

```js
const myReplacer = compileTemplate('{name}_COPY_\{name}_{id}_%\%', {
  '{name}': vm => vm.name_label,
  '{id}': vm => vm.id,
  '%': (_, i) => i
})

const newString = myReplacer({
  name_label: 'foo',
  id: 42,
}, 32)

newString === 'foo_COPY_{name}_42_32%' // true
```

## Development

```
# Install dependencies
> yarn

# Run the tests
> yarn test

# Continuously compile
> yarn dev

# Continuously run the tests
> yarn dev-test

# Build for production (automatically called by npm install)
> yarn build
```

## Contributions

Contributions are *very* welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

ISC © [Vates SAS](https://vates.fr)
