# ${pkg.name} [![Build Status](https://travis-ci.org/${pkg.shortGitHubPath}.png?branch=master)](https://travis-ci.org/${pkg.shortGitHubPath})

> ${pkg.description}

## Install

Installation of the [npm package](https://npmjs.org/package/${pkg.name}):

```
> npm install --save ${pkg.name}
```

## Usage


Creates a string replacer based on a pattern and a list of rules

```js
const myReplacer = buildTemplate('{name}_COPY_\{name}_{id}_%\%', {
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

- report any [issue](${pkg.bugs})
  you've encountered;
- fork and create a pull request.

## License

${pkg.license} © [${pkg.author.name}](${pkg.author.url})
