# @xen-orchestra/emit-async [![Build Status](https://travis-ci.org/${pkg.shortGitHubPath}.png?branch=master)](https://travis-ci.org/${pkg.shortGitHubPath})

> ${pkg.description}

## Install

Installation of the [npm package](https://npmjs.org/package/@xen-orchestra/emit-async):

```
> npm install --save @xen-orchestra/emit-async
```

## Usage

```js
import EE from 'events'
import emitAsync from '@xen-orchestra/emit-async'

const ee = new EE()
ee.emitAsync = emitAsync

ee.on('start', async function () {
  // whatever
})

// similar to EventEmmiter#emit() but returns a promise which resolves when all
// listeners have resolved
await ee.emitAsync('start')

// by default, it will rejects as soon as one listener reject, you can customise
// error handling though:
await ee.emitAsync({
  onError (error) {
    console.warn(error)
  }
}, 'start')
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
