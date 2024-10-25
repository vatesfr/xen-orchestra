<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @vates/xml-rpc

[![Package Version](https://badgen.net/npm/v/@vates/xml-rpc)](https://npmjs.org/package/@vates/xml-rpc) ![License](https://badgen.net/npm/license/@vates/xml-rpc) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@vates/xml-rpc)](https://bundlephobia.com/result?p=@vates/xml-rpc) [![Node compatibility](https://badgen.net/npm/node/@vates/xml-rpc)](https://npmjs.org/package/@vates/xml-rpc)

> Parse and format XML-RPC messages, do not handle transport or XML

## Install

Installation of the [npm package](https://npmjs.org/package/@vates/xml-rpc):

```sh
npm install --save @vates/xml-rpc
```

## Usage

### Formatting

```js
import { xmlRpcFormatter } from '@vates/xml-rpc/formatter'

// There is a dedicated method per XML-RPC tag (`array`, `string`, etc.)
xmlRpcFormatter.format_methodCall({
  methodName: 'examples.getStateName',
  params: [40],
})
// → {
//   name: 'methodCall',
//   children: [
//     {
//       name: 'methodName',
//       children: [ 'examples.getStateName' ]
//     },
//     {
//       name: 'params',
//       children: [
//         {
//           name: 'param',
//           children: [ { name: 'value', children: [ '40' ] } ]
//         }
//       ]
//     }
//   ]
// }

// There is a dedicated method to format a JS value
xmlRpcFormatter.format_js(new Date(900684535000))
// → {
//   name: 'dateTime.iso8601',
//   children: [ '1998-07-17T14:08:55.000Z' ]
// }
```

Formatting XML is out of this library's scope, but you can achieve it easily with
`@vates/xml`:

```js
import { formatXml } from '@vates/xml/format'

// it can now be passed to the XML-RPC parser
const tree = xmlRpcFormatter.format_methodCall({
  methodName: 'examples.getStateName',
  params: [40],
})

// avoid any indentation or new lines as it will confuse many XML-RPC parsers.
const xml = formatXml(tree, { indent: 0 })
```

### Parsing

```js
import { xmlRpcParser } from '@vates/xml-rpc/parser'

xmlRpcParser.parse({
  name: 'methodResponse',
  children: [
    {
      name: 'params',
      children: [
        {
          name: 'param',
          children: [
            {
              name: 'value',
              children: [
                {
                  name: 'string',
                  children: ['South Dakota'],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
})
// { params: [ 'South Dakota' ] }

// There is a dedicated method per XML-RPC tag (`array`, `string`, etc.)
xmlRpcParser.parse_array({
  name: 'array',
  children: [
    {
      name: 'data',
      children: [
        {
          name: 'value',
          children: [{ name: 'boolean', children: ['1'] }],
        },
        {
          name: 'value',
          children: [{ name: 'int', children: ['42'] }],
        },
      ],
    },
  ],
})
// [ true, 42 ]
```

Parsing XML is out of this library's scope, but you can achieve it easily with
`@vates/xml`:

```js
import { parseXml } from '@vates/xml/parse'

const xml = `
<?xml version="1.0"?>
<methodResponse>
  <params>
    <param>
        <value><string>South Dakota</string></value>
    </param>
  </params>
</methodResponse>
`

// do not normalize or trim whitespaces as it will break string values
const tree = parseXml(xml, { normalize: false, trim: false })

// it can now be passed to the XML-RPC parser
xmlRpcParser.parse(tree)
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
