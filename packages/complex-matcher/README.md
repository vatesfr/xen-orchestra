<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# complex-matcher

[![Package Version](https://badgen.net/npm/v/complex-matcher)](https://npmjs.org/package/complex-matcher) ![License](https://badgen.net/npm/license/complex-matcher) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/complex-matcher)](https://bundlephobia.com/result?p=complex-matcher) [![Node compatibility](https://badgen.net/npm/node/complex-matcher)](https://npmjs.org/package/complex-matcher)

> Advanced search syntax used in XO

## Install

Installation of the [npm package](https://npmjs.org/package/complex-matcher):

```sh
npm install --save complex-matcher
```

## Usage

```js
import * as CM from 'complex-matcher'

const places = {
  gotham: { name: 'Gotham City', planet: 'Earth' },
  krypton: { name: 'Krypton', planet: 'Krypton', destroyed: true },
  themyscira: { name: 'Themyscira', planet: 'Earth' },
}

const characters = [
  { name: 'Catwoman', costumeColor: 'black', originId: 'gotham', visitedIds: ['gotham'] },
  { name: 'Superman', costumeColor: 'blue', hasCape: true, originId: 'krypton', visitedIds: ['gotham', 'krypton'] },
  { name: 'Wonder Woman', costumeColor: 'blue', originId: 'themyscira', visitedIds: [] },
]

// [resolve] requires a resolver, calling createPredicate() without one throws.
// [resolve] can be nested up to a depth of 5, beyond it throws at parse time.
const resolver = id => places[id]

// --------------------------------------------

const costumeColorPredicate = CM.parse('costumeColor:blue hasCape?').createPredicate()
characters.filter(costumeColorPredicate)
// [
//   { name: 'Superman', costumeColor: 'blue', hasCape: true, originId: 'krypton', visitedIds: ['gotham', 'krypton'] },
// ]

const originPlanetPredicate = CM.parse('originId:[resolve]:planet:Earth').createPredicate(resolver)
characters.filter(originPlanetPredicate)
// [
//   { name: 'Catwoman', costumeColor: 'black', originId: 'gotham', visitedIds: ['gotham'] },
//   { name: 'Wonder Woman', costumeColor: 'blue', originId: 'themyscira', visitedIds: [] },
// ]

const earthPredicate = CM.parse('visitedIds:[resolve]:planet:Earth').createPredicate(resolver)
characters.filter(earthPredicate)
// No quantifier defaults to [some].
// [
//   { name: 'Catwoman', costumeColor: 'black', originId: 'gotham', visitedIds: ['gotham'] },
//   { name: 'Superman', costumeColor: 'blue', hasCape: true, originId: 'krypton', visitedIds: ['gotham', 'krypton'] },
// ]

const someEarthPredicate = CM.parse('visitedIds:[resolve]:[some]:planet:Earth').createPredicate(resolver)
characters.filter(someEarthPredicate)
// [
//   { name: 'Catwoman', costumeColor: 'black', originId: 'gotham', visitedIds: ['gotham'] },
//   { name: 'Superman', costumeColor: 'blue', hasCape: true, originId: 'krypton', visitedIds: ['gotham', 'krypton'] },
// ]

const everyEarthPredicate = CM.parse('visitedIds:[resolve]:[every]:planet:Earth').createPredicate(resolver)
characters.filter(everyEarthPredicate)
// Wonder Woman is excluded because [every] requires at least one resolved object.
// [
//   { name: 'Catwoman', costumeColor: 'black', originId: 'gotham', visitedIds: ['gotham'] },
// ]

new CM.String('foo').createPredicate()
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
