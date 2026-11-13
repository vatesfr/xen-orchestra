'use strict'

const assert = require('node:assert/strict')
const { describe, it } = require('node:test')

const createTransport = require('./_createTransport.js')
const { createCaptureTransport } = require('./capture.js')
const { configure } = require('./configure.js')
const { dedupe } = require('./dedupe.js')

function createClosable(logs = []) {
  const transport = log => {
    logs.push(log)
  }
  transport.nCloses = 0
  transport.close = () => {
    ++transport.nCloses
  }
  return transport
}

describe('closing transports', () => {
  it('closes the transports of a list, through filters, capture and dedupe', () => {
    const a = createClosable()
    const b = createClosable()
    const transport = createCaptureTransport({
      level: 'info',
      transport: dedupe({ transport: [a, { filter: 'foo', transport: b }, () => {}] }),
    })

    transport.close()
    assert.equal(a.nCloses, 1)
    assert.equal(b.nCloses, 1)
  })

  it('flushes the hidden duplicates before closing', () => {
    const logs = []
    const transport = dedupe({ transport: createClosable(logs) })
    const log = { level: 30, message: 'foo', namespace: 'ns', data: {} }
    transport(log)
    transport({ ...log })
    transport({ ...log })
    assert.equal(logs.length, 1)

    transport.close()
    assert.equal(logs.length, 2)
    assert.equal(logs[1].data.nDuplicates, 2)
  })

  it('configure() closes the replaced transport', () => {
    const first = createClosable()
    configure({ transport: first })
    assert.equal(first.nCloses, 0)

    configure({ transport: createClosable() })
    assert.equal(first.nCloses, 1)
  })

  it('supports transports without close()', () => {
    createTransport([() => {}, { transport: () => {} }]).close()
  })
})
