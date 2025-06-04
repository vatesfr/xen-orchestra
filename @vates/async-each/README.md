<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @vates/async-each

[![Package Version](https://badgen.net/npm/v/@vates/async-each)](https://npmjs.org/package/@vates/async-each) ![License](https://badgen.net/npm/license/@vates/async-each) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@vates/async-each)](https://bundlephobia.com/result?p=@vates/async-each) [![Node compatibility](https://badgen.net/npm/node/@vates/async-each)](https://npmjs.org/package/@vates/async-each)

> Run async fn for each item in (async) iterable

## Install

Installation of the [npm package](https://npmjs.org/package/@vates/async-each):

```sh
npm install --save @vates/async-each
```

## Usage

### `asyncEach(iterable, iteratee, [opts])`

Executes `iteratee` in order for each value yielded by `iterable`.

Returns a promise wich rejects as soon as a call to `iteratee` throws or a promise returned by it rejects, and which resolves when all promises returned by `iteratee` have resolved.

`iterable` must be an iterable or async iterable.

`iteratee` is called with the same `this` value as `asyncEach`, and with the following arguments:

- `value`: the value yielded by `iterable`
- `index`: the 0-based index for this value
- `iterable`: the iterable itself

`opts` is an object that can contains the following options:

- `concurrency`: a number which indicates the maximum number of parallel call to `iteratee`, defaults to `10`. The value `0` means no concurrency limit.
- `signal`: an abort signal to stop the iteration
- `stopOnError`: whether to stop iteration of first error, or wait for all calls to finish and throw an `AggregateError`, defaults to `true`

```js
import { asyncEach } from '@vates/async-each'

const contents = []
await asyncEach(
  ['foo.txt', 'bar.txt', 'baz.txt'],
  async function (filename, i) {
    contents[i] = await readFile(filename)
  },
  {
    // reads two files at a time
    concurrency: 2,
  }
)
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
