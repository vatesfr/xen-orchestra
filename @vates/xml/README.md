<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @vates/xml

[![Package Version](https://badgen.net/npm/v/@vates/xml)](https://npmjs.org/package/@vates/xml) ![License](https://badgen.net/npm/license/@vates/xml) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@vates/xml)](https://bundlephobia.com/result?p=@vates/xml) [![Node compatibility](https://badgen.net/npm/node/@vates/xml)](https://npmjs.org/package/@vates/xml)

> Simple XML formatting/parsing

## Install

Installation of the [npm package](https://npmjs.org/package/@vates/xml):

```sh
npm install --save @vates/xml
```

## Usage

### `parseXml(xml, [opts])`

> Based on [`sax`](https://www.npmjs.com/package/sax)

`opts` is an optional object which can contain the following options:

- `normalize = true`: if true, then turn any whitespace into a single space
- `strict = true`: whether or not to be a jerk
- `trim = true`: whether or not to trim text nodes

```js
import { parseXml } from '@xen-orchestra/xml/parse'

const tree = parseXml(`<?xml version="1.0" encoding="UTF-8"?>
<tag1 attr1="value1" attr2="value2">
  Text &amp; entities
  <tag2 />
  <tag2 />
  <ns:tag3 />
</tag1>
`)
// → {
//   name: 'tag1',
//   attributes: { attr1: 'value1', attr2: 'value2' },
//   children: [
//     'Text & entities',
//     { name: 'tag2', attributes: {}, children: [] },
//     { name: 'tag2', attributes: {}, children: [] },
//     { name: 'ns:tag3', attributes: {}, children: [] }
//   ]
// }
```

### `formatXml(tree, [opts])`

`opts` is an optional object which can contain the following options:

- `includeDeclaration = true`: whether to include an XML declaration
- `indent = 2`: string or number of spaces to use to indent; if an empty string or `0`, no indent or new lines will be used

```js
import { formatXml } from '@xen-orchestra/xml/format'

formatXml({
  name: 'tag1',
  attributes: { attr1: 'value1', attr2: 'value2' },
  children: ['Text & entities', { name: 'tag2' }, { name: 'tag2' }, { name: 'ns:tag3' }],
})
// → <?xml version="1.0" encoding="UTF-8"?>
// <tag1 attr1="value1" attr2="value2">
//   Text &amp; entities
//   <tag2 />
//   <tag2 />
//   <ns:tag3 />
// </tag1>
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
