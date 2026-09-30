import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { configure } from '@xen-orchestra/log/configure'
import { LEVELS } from '@xen-orchestra/log/levels'
import createMemoryTransport from '@xen-orchestra/log/transports/memory'

import { createSseParser } from './kubernetes.sse.helper.mjs'

// the logs are kept in memory instead of being printed while the tests run, which also
// makes them assertable
const transport = createMemoryTransport()
configure({ level: 'WARN', transport })

const encoder = new TextEncoder()
const encode = (text: string) => encoder.encode(text)

// parses a whole stream given as a single chunk
const parse = (stream: string) => createSseParser().push(encode(stream))

describe('createSseParser#push', () => {
  it('parses an event received in a single chunk', () => {
    assert.deepEqual(parse('event: update\ndata: {"id":"cluster-1","phase":"Running"}\n\n'), [
      { event: 'update', data: { id: 'cluster-1', phase: 'Running' } },
    ])
  })

  it('parses several events received in a single chunk', () => {
    assert.deepEqual(parse('event: add\ndata: {"id":"a"}\n\nevent: remove\ndata: {"id":"b"}\n\n'), [
      { event: 'add', data: { id: 'a' } },
      { event: 'remove', data: { id: 'b' } },
    ])
  })

  it('parses an event split across several chunks', () => {
    const parser = createSseParser()

    // the chunks are split in the middle of a field name, of the data and of the final
    // empty line
    assert.deepEqual(parser.push(encode('event: up')), [])
    assert.deepEqual(parser.push(encode('date\ndata: {"id":"clu')), [])
    assert.deepEqual(parser.push(encode('ster-1"}\n')), [])
    assert.deepEqual(parser.push(encode('\n')), [{ event: 'update', data: { id: 'cluster-1' } }])
  })

  it('returns no event while the event is not complete', () => {
    const parser = createSseParser()

    assert.deepEqual(parser.push(encode('event: update\ndata: {"id":"cluster-1"}\n')), [])
  })

  it('handles CRLF line separators', () => {
    assert.deepEqual(parse('event: update\r\ndata: {"id":"cluster-1"}\r\n\r\n'), [
      { event: 'update', data: { id: 'cluster-1' } },
    ])
  })

  it('handles a CRLF split across two chunks', () => {
    const parser = createSseParser()

    assert.deepEqual(parser.push(encode('event: update\r')), [])
    assert.deepEqual(parser.push(encode('\ndata: {"id":"cluster-1"}\r\n\r\n')), [
      { event: 'update', data: { id: 'cluster-1' } },
    ])
  })

  it('handles a multi-byte character split across two chunks', () => {
    const bytes = encode('data: {"name":"café"}\n\n')

    // `é` is encoded on two bytes, the chunks are split between them
    const splitAt = bytes.indexOf(0xc3) + 1
    const parser = createSseParser()

    assert.deepEqual(parser.push(bytes.slice(0, splitAt)), [])
    assert.deepEqual(parser.push(bytes.slice(splitAt)), [{ event: 'message', data: { name: 'café' } }])
  })

  it('concatenates the data of several `data:` lines', () => {
    assert.deepEqual(parse('event: update\ndata: {"id":\ndata: "cluster-1"}\n\n'), [
      { event: 'update', data: { id: 'cluster-1' } },
    ])
  })

  it('uses `message` as event name when there is no `event:` line', () => {
    assert.deepEqual(parse('data: {"id":"cluster-1"}\n\n'), [{ event: 'message', data: { id: 'cluster-1' } }])
  })

  it('does not require a space after the colon', () => {
    assert.deepEqual(parse('event:update\ndata:{"id":"cluster-1"}\n\n'), [
      { event: 'update', data: { id: 'cluster-1' } },
    ])
  })

  it('does not trim the value, only the space which follows the colon', () => {
    assert.deepEqual(parse('data: {"name":"  padded  "}\n\n'), [{ event: 'message', data: { name: '  padded  ' } }])
  })

  it('ignores the comments', () => {
    assert.deepEqual(parse(': keep-alive\n\n'), [])
    assert.deepEqual(parse('event: update\n: keep-alive\ndata: {"id":"cluster-1"}\n\n'), [
      { event: 'update', data: { id: 'cluster-1' } },
    ])
  })

  it('ignores the fields which are not handled', () => {
    assert.deepEqual(parse('id: 42\nretry: 3000\nevent: update\ndata: {"id":"cluster-1"}\n\n'), [
      { event: 'update', data: { id: 'cluster-1' } },
    ])
  })

  it('ignores an event without data', () => {
    assert.deepEqual(parse('event: update\n\n'), [])
  })

  it('ignores an event whose data is not valid JSON, warns and keeps parsing the stream', () => {
    const parser = createSseParser()

    assert.deepEqual(parser.push(encode('event: update\ndata: not json\n\n')), [])

    const logs = transport.logs.filter(({ message }: { message: string }) => message.includes('not json'))
    assert.equal(logs.length, 1)
    assert.equal(logs[0].level, LEVELS.WARN)

    assert.deepEqual(parser.push(encode('event: update\ndata: {"id":"cluster-1"}\n\n')), [
      { event: 'update', data: { id: 'cluster-1' } },
    ])
  })

  it('does not keep the fields of an event which has been dispatched', () => {
    const parser = createSseParser()

    assert.deepEqual(parser.push(encode('event: update\ndata: {"id":"cluster-1"}\n\n')), [
      { event: 'update', data: { id: 'cluster-1' } },
    ])
    // no `event:` line: the name of the previous event must not be reused
    assert.deepEqual(parser.push(encode('data: {"id":"cluster-2"}\n\n')), [
      { event: 'message', data: { id: 'cluster-2' } },
    ])
  })
})

describe('createSseParser#end', () => {
  it('parse events without trailing blank lines', () => {
    const parser = createSseParser()

    assert.deepEqual(parser.push(encode('event: update\ndata: {"id":"cluster-1"}')), [])
    assert.deepEqual(parser.end(), [{ event: 'update', data: { id: 'cluster-1' } }])
  })

  it('parse an empty stream', () => {
    const parser = createSseParser()

    assert.deepEqual(parser.push(encode('')), [])
    assert.deepEqual(parser.end(), [])
  })
})
