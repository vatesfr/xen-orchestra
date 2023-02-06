<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @vates/event-listeners-manager

[![Package Version](https://badgen.net/npm/v/@vates/event-listeners-manager)](https://npmjs.org/package/@vates/event-listeners-manager) ![License](https://badgen.net/npm/license/@vates/event-listeners-manager) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@vates/event-listeners-manager)](https://bundlephobia.com/result?p=@vates/event-listeners-manager) [![Node compatibility](https://badgen.net/npm/node/@vates/event-listeners-manager)](https://npmjs.org/package/@vates/event-listeners-manager)

## Install

Installation of the [npm package](https://npmjs.org/package/@vates/event-listeners-manager):

```sh
npm install --save @vates/event-listeners-manager
```

## Usage

> This library is compatible with Node's `EventEmitter` and web browsers' `EventTarget` APIs.

### API

```js
import { EventListenersManager } from '@vates/event-listeners-manager'

const events = new EventListenersManager(emitter)

// adding listeners
events.add('foo', onFoo).add('bar', onBar).on('baz', onBaz)

// removing a specific listener
events.remove('foo', onFoo)

// removing all listeners for a specific event
events.removeAll('foo')

// removing all listeners
events.removeAll()
```

### Typical use case

> Removing all listeners when no longer necessary.

Manually:

```js
const onFoo = () => {}
const onBar = () => {}
const onBaz = () => {}
emitter.on('foo', onFoo).on('bar', onBar).on('baz', onBaz)

// CODE LOGIC

emitter.off('foo', onFoo).off('bar', onBar).off('baz', onBaz)
```

With this library:

```js
const events = new EventListenersManager(emitter)

events.add('foo', () => {})).add('bar', () => {})).add('baz', () => {}))

// CODE LOGIC

events.removeAll()
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
