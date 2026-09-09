import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { AggregatedIncrementalXapiWriter } from './AggregatedIncrementalXapiWriter.mjs'

const SRS = [
  { uuid: 'sr-1', name_label: 'SR 1' },
  { uuid: 'sr-2', name_label: 'SR 2' },
]

// Stands in for IncrementalXapiWriter: only reproduces what checkBaseVdis() does with its
// two arguments, including the `contentKeys.get()` that used to throw.
const makeFakeWriterClass = ({ srWithABase } = {}) => {
  const calls = []
  class FakeReplicationWriter {
    constructor({ sr }) {
      this._sr = sr
    }

    async checkBaseVdis(baseUuidToSrcVdi, contentKeys) {
      calls.push({ srUuid: this._sr.uuid, baseUuidToSrcVdi, contentKeys })
      for (const baseUuid of [...baseUuidToSrcVdi.keys()]) {
        // the real writer looks the base up by content key first
        const hasBase = contentKeys.get(baseUuid) !== undefined && this._sr.uuid === srWithABase
        if (!hasBase) {
          baseUuidToSrcVdi.delete(baseUuid)
        }
      }
    }
  }
  return { FakeReplicationWriter, calls }
}

const makeWriter = ReplicationWriter =>
  new AggregatedIncrementalXapiWriter({
    srs: SRS,
    ReplicationWriter,
    settings: { copyRetention: 1 },
    job: { id: 'job-1', settings: {} },
    scheduleId: 'schedule-1',
    vmUuid: 'vm-1',
  })

describe('regression: AggregatedIncrementalXapiWriter.checkBaseVdis() drops the content keys', () => {
  it('forwards the content keys to every underlying writer', async () => {
    const { FakeReplicationWriter, calls } = makeFakeWriterClass({ srWithABase: 'sr-2' })
    const writer = makeWriter(FakeReplicationWriter)
    await writer.setupWriters()

    const contentKeys = new Map([['base-1', 'content-key-1']])

    // used to reject with "Cannot read properties of undefined (reading 'get')", which
    // removed the writer from the whole job execution and silently skipped replication
    await writer.checkBaseVdis(new Map([['base-1', 'src-vdi-1']]), contentKeys)

    assert.equal(calls.length, SRS.length, 'every underlying writer should be asked')
    for (const call of calls) {
      assert.equal(call.contentKeys, contentKeys, `writer for ${call.srUuid} should receive the content keys map`)
    }
  })

  it('selects as main writer the SR that has a usable base', async () => {
    const { FakeReplicationWriter } = makeFakeWriterClass({ srWithABase: 'sr-2' })
    const writer = makeWriter(FakeReplicationWriter)
    await writer.setupWriters()

    const baseUuidToSrcVdi = new Map([['base-1', 'src-vdi-1']])
    await writer.checkBaseVdis(baseUuidToSrcVdi, new Map([['base-1', 'content-key-1']]))

    assert.equal(writer.mainWriter?._sr.uuid, 'sr-2')
    assert.deepEqual([...baseUuidToSrcVdi], [['base-1', 'src-vdi-1']], 'the base found on sr-2 should be kept')
  })

  it('keeps no base, and no main writer, when no SR has one', async () => {
    const { FakeReplicationWriter } = makeFakeWriterClass({ srWithABase: undefined })
    const writer = makeWriter(FakeReplicationWriter)
    await writer.setupWriters()

    const baseUuidToSrcVdi = new Map([['base-1', 'src-vdi-1']])
    await writer.checkBaseVdis(baseUuidToSrcVdi, new Map([['base-1', 'content-key-1']]))

    assert.equal(writer.mainWriter, undefined, 'prepare() should then fall back to a new SR')
    assert.equal(baseUuidToSrcVdi.size, 0, 'the transfer must be a full')
  })
})
