import assert from 'node:assert/strict'
import Disposable from 'promise-toolbox/Disposable'
import { describe, it } from 'node:test'

import { filenameOf, metadataOf, VM } from './_vmBackupsFixtures.mjs'
import { VmBackupsSource } from './_vmBackupsSource.mjs'

const REPOSITORY = { id: 'a-repository-id', url: 'file:///media/backup' }

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
const formattedOf = name => ({ id: filenameOf(VM, name), backupRepository: REPOSITORY.id, timestamp: 1 })

describe('listAll()', () => {
  it('keys the backups of each VM by the name of their metadata', async () => {
    const metadata = metadataOf(VM, '20260811T090000')
    const source = createSource({ listAllVmBackups: async () => ({ [VM]: [metadata] }) })

    const backupsByVm = await source.listAll(REPOSITORY)

    assert.deepEqual(Object.keys(backupsByVm[VM]), [metadata._filename])
    const backup = backupsByVm[VM][metadata._filename]
    assert.equal(backup.id, metadata._filename)
    assert.equal(backup.backupRepository, REPOSITORY.id)
    assert.equal(backup.size, 1)
  })
})

describe('listOneVm()', () => {
  it('lists a single VM, keyed like a full listing', async () => {
    const metadata = metadataOf(VM, '20260811T090000')
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
    const metadata = metadataOf(VM, '20260811T090000')
    const source = createSource({
      readBackupJournalEvents: async (cursor, opts) => {
        assert.equal(cursor, 'a-cursor')
        assert.deepEqual(opts, { mustExist: false })
        return {
          cursor: 'the-next-cursor',
          events: [
            { event: 'change', vmUuid: VM, filename: metadata._filename, metadata },
            { event: 'del', vmUuid: VM, filename: filenameOf(VM, '20260811T093000') },
          ],
        }
      },
    })

    const { events, cursor } = await source.readJournal(REPOSITORY, 'a-cursor', { mustExist: false })

    assert.equal(cursor, 'the-next-cursor', 'the cursor of the read must be forwarded untouched')
    assert.equal(events[0].backup.id, metadata._filename)
    assert.equal(events[0].backup.backupRepository, REPOSITORY.id)
    assert.equal(events[1].backup, undefined, 'a deletion carries no backup')
    assert.equal(events[1].filename, filenameOf(VM, '20260811T093000'))
  })
})

describe('on a repository attached to a proxy', () => {
  it('keys the backups the proxy formatted', async () => {
    const backup = formattedOf('20260811T090000')
    const { calls, source } = createProxiedSource({
      'backup.listVmBackups': () => ({ [REPOSITORY.id]: { [VM]: [backup] } }),
    })

    const backupsByVm = await source.listAll(PROXIED_REPOSITORY)

    assert.deepEqual(backupsByVm, { [VM]: { [backup.id]: backup } })
    assert.deepEqual(
      calls.map(_ => _.method),
      ['backup.listVmBackups']
    )
  })

  it('fails the listing when the proxy could not read the repository', async () => {
    const { source } = createProxiedSource({
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
        cursor: 'the-next-cursor',
      }),
    })

    const read = await source.readJournal(PROXIED_REPOSITORY, 'a-cursor', { mustExist: true })

    assert.equal(read.cursor, 'the-next-cursor')
    assert.deepEqual(read.events[0].backup, backup)
    assert.deepEqual(calls[0].params, {
      remote: { url: REPOSITORY.url, options: undefined },
      remoteId: REPOSITORY.id,
      cursor: 'a-cursor',
      mustExist: true,
    })
  })

  it('drops the event kinds this version does not know, from a more recent proxy', async () => {
    const backup = formattedOf('20260811T090000')
    const added = { event: 'add', vmUuid: VM, filename: backup.id, backup }
    const { source } = createProxiedSource({
      'backup.listVmBackupsJournal': () => ({
        events: [{ event: 'a-future-event', vmUuid: VM, filename: filenameOf(VM, '20260811T100000') }, added],
        cursor: 'the-next-cursor',
      }),
    })

    assert.deepEqual(await source.readJournal(PROXIED_REPOSITORY, 'a-cursor'), {
      events: [added],
      cursor: 'the-next-cursor',
    })
  })

  it('reports a proxy which does not expose its journal as unreplayable, and warns once', async () => {
    const { calls, source } = createProxiedSource({
      'backup.listVmBackups': () => ({ [REPOSITORY.id]: {} }),
    })

    assert.equal(await source.readJournal(PROXIED_REPOSITORY, 'a-cursor'), undefined)
    assert.equal(await source.readJournal(PROXIED_REPOSITORY, 'a-cursor'), undefined)

    // an old proxy can still be listed in full
    await source.listAll(PROXIED_REPOSITORY)

    // the method is still called every time, so a proxy which gets upgraded is replayed at once
    assert.equal(calls.filter(_ => _.method === 'backup.listVmBackupsJournal').length, 2)
  })

  it('lets an error other than a missing method fail the read', async () => {
    const { source } = createProxiedSource({
      'backup.listVmBackupsJournal': () => {
        throw new Error('the proxy is unreachable')
      },
    })

    await assert.rejects(source.readJournal(PROXIED_REPOSITORY, 'a-cursor'), /unreachable/)
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
