<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @vates/generator-toolbox

[![Package Version](https://badgen.net/npm/v/@vates/generator-toolbox)](https://npmjs.org/package/@vates/generator-toolbox) ![License](https://badgen.net/npm/license/@vates/generator-toolbox) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@vates/generator-toolbox)](https://bundlephobia.com/result?p=@vates/generator-toolbox) [![Node compatibility](https://badgen.net/npm/node/@vates/generator-toolbox)](https://npmjs.org/package/@vates/generator-toolbox)

## Install

Installation of the [npm package](https://npmjs.org/package/@vates/generator-toolbox):

```sh
npm install --save @vates/generator-toolbox
```

## Usage

A toolbox to ease the use of generator

### Timeout

wrap a source async generator to have it throw an error when timeout is reached
timeout is a positive number in milliseconds

```js
import { Timeout } from '@vates/generator-toolbox'

const wrappedGenerator = new Timeout(sourceGenerator, timeout)
```

### Throttle

wrap a source async generator to have it respect a max speed ( in bytes per seconds).
speed is either a strictly positive number or a function returning a strictly positive number. A speed change will be used for the next emitted packet.

The source generator must yield object with a length property.

Optimized for small yields regarding to the speed, since it won't split incoming packet.

If the generator reached the max speed it will be paused, limiting memory consumption.

```js
import { Throttle } from '@vates/generator-toolbox'

const wrappedGenerator = new Throttle(sourceGenerator, speed)
```

### Synchronized

Fork a generator. The rules ares:

- if the source returns, all the forks returns
- if the forks error, all the forks errors with the same error
- if a fork return , it is stopped, but the generator continue with the other
- if a fork errors, it is stopped, but the generator continue with the other
- if all the fork return , the source is stopped
- if all the fork error , the source is errored with the last error
- the source start producing a packet when the fastest forked ask for it
- the source forks get the packet only when all the forks asked for it, no buffer stores in memory

```ts
import { Synchronized } from '@vates/generator-toolbox'

async function consume(generator: AsyncGenerator) {
  for await (const val of generator) {
    console.log({ val })
  }
}
const forker = new Synchronized(generator)
const first = forker.fork('first')
const second = forker.fork('second')
await Promise.all([consume(first), consume(second)])
```

Note: you can stop early a generator by calling `generator.return()`, and you can stop in in error by calling `generator.throw(error)`

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

[MIT](https://spdx.org/licenses/MIT) © [Vates SAS](https://vates.fr)
