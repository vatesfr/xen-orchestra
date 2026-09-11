import assert from 'node:assert/strict'
import Disposable from 'promise-toolbox/Disposable'
import { describe, it } from 'node:test'

import { VmBackupsSource } from './_vmBackupsSource.mjs'

const REPOSITORY = { id: 'a-repository-id', url: 'file:///media/backup' }
const VM = 'a-vm-uuid'

// `RemoteAdapter` lists and writes the metadata with a leading slash
const filenameOf = name => `/xo-vm-backups/${VM}/${name}.json`

const metadataOf = (name, props) => ({
  _filename: filenameOf(name),
  jobId: 'a-job-id',
  mode: 'full',
  scheduleId: 'a-schedule-id',
  size: 1,
  timestamp: Date.parse(`${name}Z`),
  vm: { uuid: VM, name_label: 'a VM', name_description: '', tags: [] },
  ...props,
})

// instantiates the source with the minimum an `Xo` app provides to it
const createSource = adapter =>
  new VmBackupsSource({
    getBackupsRemoteAdapter(repository) {
      assert.equal(repository.id, REPOSITORY.id)
      return new Disposable(() => {}, adapter)
    },
  })

const PROXY = 'a-proxy-id'
const PROXIED_REPOSITORY = { ...REPOSITORY, proxy: PROXY }

const methodNotFound = method =>
  // what `callProxyMethod()` throws back: the deserialized payload, not an `Error`
  ({ code: -32601, message: `method not found: ${method}`, data: method })

// records every call and answers them from `handlers`
const createProxiedSource = handlers => {
  const calls = []
  const source = new VmBackupsSource({
    async callProxyMethod(proxyId, method, params) {
      assert.equal(proxyId, PROXY)
      calls.push({ method, params })
      const handler = handlers[method]
      if (handler === undefined) {
        throw methodNotFound(method)
      }
      return handler(params)
    },
  })
  return { calls, source }
}

// a backup as a proxy returns it, i.e. already formatted
const formattedOf = name => ({ id: filenameOf(name), backupRepository: REPOSITORY.id, timestamp: 1 })

describe('listAll()', () => {
  it('keys the backups of each VM by the name of their metadata', async () => {
    const metadata = metadataOf('20260811T090000')
    const source = createSource({ listAllVmBackups: async () => ({ [VM]: [metadata] }) })

    const { backupsByVm } = await source.listAll(REPOSITORY)

    assert.deepEqual(Object.keys(backupsByVm[VM]), [metadata._filename])
    const backup = backupsByVm[VM][metadata._filename]
    assert.equal(backup.id, metadata._filename)
    assert.equal(backup.backupRepository, REPOSITORY.id)
    assert.equal(backup.size, 1)
  })

  it('takes the watermark before the listing, so the events during it are replayed afterwards', async t => {
    t.mock.timers.enable({ apis: ['Date'], now: Date.parse('2026-08-11T10:00:00Z') })

    const source = createSource({
      listAllVmBackups: async () => {
        // a listing is slow on an object storage: a backup can be written while it runs
        t.mock.timers.tick(30e3)
        return {}
      },
    })

    const { lastJournalRead } = await source.listAll(REPOSITORY)
    assert.equal(lastJournalRead, Date.now() - 30e3)
  })
})

describe('listOneVm()', () => {
  it('lists a single VM, keyed like a full listing', async () => {
    const metadata = metadataOf('20260811T090000')
    const source = createSource({
      listVmBackups: async vmUuid => {
        assert.equal(vmUuid, VM)
        return [metadata]
      },
    })

    assert.deepEqual(Object.keys(await source.listOneVm(REPOSITORY, VM)), [metadata._filename])
  })
})

describe('readJournal()', () => {
  it('resolves the backups the events are about and passes the deletions through', async () => {
    const metadata = metadataOf('20260811T090000')
    const source = createSource({
      readBackupJournalEvents: async since => {
        assert.equal(since, 42)
        return {
          lastJournalRead: 1234,
          events: [
            { event: 'change', vmUuid: VM, filename: metadata._filename, metadata },
            { event: 'del', vmUuid: VM, filename: filenameOf('20260811T093000') },
          ],
        }
      },
    })

    const { events, lastJournalRead } = await source.readJournal(REPOSITORY, 42)

    assert.equal(lastJournalRead, 1234, 'the watermark of the read must be forwarded untouched')
    assert.equal(events[0].backup.id, metadata._filename)
    assert.equal(events[0].backup.backupRepository, REPOSITORY.id)
    assert.equal(events[1].backup, undefined, 'a deletion carries no backup')
    assert.equal(events[1].filename, filenameOf('20260811T093000'))
  })
})

describe('on a repository attached to a proxy', () => {
  it('keys the backups the proxy formatted, and takes its watermark before the listing', async () => {
    const backup = formattedOf('20260811T090000')
    const { calls, source } = createProxiedSource({
      'backup.listVmBackupsJournal': () => ({ events: [], lastJournalRead: 1234 }),
      'backup.listVmBackups': () => ({ [REPOSITORY.id]: { [VM]: [backup] } }),
    })

    const { backupsByVm, lastJournalRead } = await source.listAll(PROXIED_REPOSITORY)

    assert.deepEqual(backupsByVm, { [VM]: { [backup.id]: backup } })
    assert.equal(lastJournalRead, 1234, 'the watermark must be the one the proxy stamped')

    // the two calls must not be sent in parallel: a watermark stamped after the listing would skip
    // every event which happened during it
    assert.deepEqual(
      calls.map(_ => _.method),
      ['backup.listVmBackupsJournal', 'backup.listVmBackups']
    )
    assert.equal(calls[0].params.since, undefined, 'the journal must not be read to get a watermark')
  })

  it('fails the listing when the proxy could not read the repository', async () => {
    const { source } = createProxiedSource({
      'backup.listVmBackupsJournal': () => ({ events: [], lastJournalRead: 1234 }),
      // the proxy omits the repositories it failed to list
      'backup.listVmBackups': () => ({}),
    })

    await assert.rejects(source.listAll(PROXIED_REPOSITORY), /failed to list the backup repository/)
  })

  it('reads the journal of the proxy', async () => {
    const backup = formattedOf('20260811T090000')
    const { calls, source } = createProxiedSource({
      'backup.listVmBackupsJournal': () => ({
        events: [{ event: 'add', vmUuid: VM, filename: backup.id, backup }],
        lastJournalRead: 5678,
      }),
    })

    const read = await source.readJournal(PROXIED_REPOSITORY, 42)

    assert.equal(read.lastJournalRead, 5678)
    assert.deepEqual(read.events[0].backup, backup)
    assert.deepEqual(calls[0].params, {
      remote: { url: REPOSITORY.url, options: undefined },
      remoteId: REPOSITORY.id,
      since: 42,
    })
  })

  it('reports a proxy which does not expose its journal as unreplayable, and warns once', async () => {
    const { calls, source } = createProxiedSource({
      'backup.listVmBackups': () => ({ [REPOSITORY.id]: {} }),
    })

    assert.equal(await source.readJournal(PROXIED_REPOSITORY, 42), undefined)
    assert.equal(await source.readJournal(PROXIED_REPOSITORY, 42), undefined)

    // an old proxy can still be listed, with a watermark which is never used
    const { lastJournalRead } = await source.listAll(PROXIED_REPOSITORY)
    assert.equal(typeof lastJournalRead, 'number')

    // the method is still called every time, so a proxy which gets upgraded is replayed at once
    assert.equal(calls.filter(_ => _.method === 'backup.listVmBackupsJournal').length, 3)
  })

  it('lets an error other than a missing method fail the read', async () => {
    const { source } = createProxiedSource({
      'backup.listVmBackupsJournal': () => {
        throw new Error('the proxy is unreachable')
      },
    })

    await assert.rejects(source.readJournal(PROXIED_REPOSITORY, 42), /unreachable/)
  })

  it('lists a single VM through the proxy', async () => {
    const backup = formattedOf('20260811T090000')
    const { calls, source } = createProxiedSource({
      'backup.listVmBackups': ({ vmId }) => ({ [REPOSITORY.id]: vmId === VM ? { [VM]: [backup] } : {} }),
    })

    assert.deepEqual(await source.listOneVm(PROXIED_REPOSITORY, VM), { [backup.id]: backup })
    assert.equal(calls[0].params.vmId, VM)
  })

  it('lists every VM when the proxy does not know how to list a single one', async () => {
    const backup = formattedOf('20260811T090000')
    const { calls, source } = createProxiedSource({
      'backup.listVmBackups': ({ vmId }) => {
        if (vmId !== undefined) {
          // what a proxy older than the `vmId` parameter answers
          throw Object.assign(new Error('invalid parameters'), { code: 10 })
        }
        return { [REPOSITORY.id]: { [VM]: [backup] } }
      },
    })

    assert.deepEqual(await source.listOneVm(PROXIED_REPOSITORY, VM), { [backup.id]: backup })
    assert.deepEqual(
      calls.map(_ => _.params.vmId),
      [VM, undefined]
    )
  })

  it('returns nothing for a VM the proxy has no backup of', async () => {
    const { source } = createProxiedSource({
      'backup.listVmBackups': () => ({ [REPOSITORY.id]: {} }),
    })

    assert.deepEqual(await source.listOneVm(PROXIED_REPOSITORY, VM), {})
  })
})
