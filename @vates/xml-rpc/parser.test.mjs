import { parser } from '@vates/xml-rpc/parser.mjs'
import assert from 'node:assert/strict'
import test from 'test'

test(function () {
  assert.deepEqual(
    parser.value({
      methodCall: {
        methodName: 'examples.getStateName',
        params: {
          param: [
            {
              value: {
                array: {
                  data: {
                    value: [{ i4: '1404' }, { string: 'Something here' }, { i4: '1' }],
                  },
                },
              },
            },
            { value: { base64: 'eW91IGNhbid0IHJlYWQgdGhpcyE=' } },
            { value: { boolean: '1' } },
            { value: { 'dateTime.iso8601': '19980717T14:08:55Z' } },
            { value: { double: '-12.53' } },
            { value: { int: '42' } },
            { value: { i4: '42' } },
            { value: { string: 'Hello world!' } },
            { value: 'Hello world!' },
            {
              value: {
                struct: {
                  member: [
                    { name: 'foo', value: { i4: '1' } },
                    { name: 'bar', value: { i4: '2' } },
                  ],
                },
              },
            },
            { value: { nil: '' } },
          ],
        },
      },
    }),
    {
      name: 'examples.getStateName',
      params: [
        [1404, 'Something here', 1],
        Buffer.from("you can't read this!"),
        true,
        new Date('1998-07-17T14:08:55Z'),
        -12.53,
        42,
        42,
        'Hello world!',
        'Hello world!',
        { foo: 1, bar: 2 },
        null,
      ],
    }
  )
})
