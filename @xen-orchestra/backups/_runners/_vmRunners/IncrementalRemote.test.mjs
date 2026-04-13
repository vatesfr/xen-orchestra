import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { IncrementalRemote } from './IncrementalRemote.mjs'

const makeAdapter = () => ({
  listVmBackups: async () => [],
  _handler: { getInfo: async () => ({ available: 0 }), _remote: { id: 'remote-id' } },
})

const makeRunner = ({ distributeBackups = false, schedule } = {}) => {
  const remoteId = 'remote-id'
  return new IncrementalRemote({
    config: {},
    job: { id: 'job-id', mode: 'delta', remotes: { id: remoteId }, settings: {}, filter: undefined },
    healthCheckSr: undefined,
    remoteAdapters: { [remoteId]: makeAdapter() },
    schedule,
    settings: { distributeBackups, exportRetention: 1, deleteFirst: false, skipDeleteOldEntries: false },
    sourceRemoteAdapter: {},
    throttleGenerator: {},
    throttleStream: {},
    vmUuid: 'vm-uuid',
  })
}

describe('IncrementalRemote prepare()', () => {
  it('prepare() with IncrementalRemoteWriter (distributeBackups: false)', async () => {
    const schedule = { id: 'schedule-id' }
    const runner = makeRunner({ distributeBackups: false, schedule })
    for (const writer of runner._writers) {
      await writer.prepare({ isFull: false })
      assert.equal(writer._schedule, schedule)
    }
  })

  it('prepare() AggregatedIncrementalRemoteWriter (distributeBackups: true)', async () => {
    const schedule = { id: 'schedule-id' }
    const runner = makeRunner({ distributeBackups: true, schedule })
    const [aggWriter] = runner._writers
    await aggWriter.setupWriters()
    await aggWriter.prepare({ isFull: false })
    assert.equal(aggWriter.props.schedule, schedule)
  })
})
