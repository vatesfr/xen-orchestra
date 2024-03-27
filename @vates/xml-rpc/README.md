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

### Parsing

```js
import parser from '@vates/xml-rpc/parser.mjs'

// There is a method per XML-RPC tag (`methodCall`, `string`, etc.)

parser.methodCall({
  methodName: 'examples.getStateName',
  params: {
    param: { value: { string: 'bar' } },
  },
})
// { name: 'examples.getStateName', params: [ 'bar' ] }

parser.array({
  data: {
    value: [{ boolean: true }, { int: '42' }],
  },
})
// [ true, 42 ]
```

Parsing XML is out of this library's scope, but you can achieve it easily with
`fast-xml-rpc`:

```js
import { XMLParser } from 'fast-xml-parser'

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

const tree = new XMLParser({
  // declaration is not supported by the XML-RPC parser
  ignoreDeclaration: true,

  // do not attempt to automatically convert numbers
  parseAttributeValue: false,
  parseTagValue: false,
})

// it can now be passed to the XML-RPC parser
parser.methodResponse(tree.methodResponse)
```

### Formatting

```js
import formatter from '@vates/xml-rpc/formatter.mjs'
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
