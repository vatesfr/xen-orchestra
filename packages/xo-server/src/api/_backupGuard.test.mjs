import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import createMemoryTransport from '@xen-orchestra/log/transports/memory'
import { configure } from '@xen-orchestra/log/configure'
import { forbiddenOperation } from 'xo-common/api-errors.js'

import backupGuard from './_backupGuard.mjs'

const transport = createMemoryTransport()
configure({ level: 'WARN', transport })

const POOL_ID = 'pool-1'

// a job with a `runId` is currently running, `vm-1` belongs to the pool, `vm-gone` was deleted
const createApp = jobs => ({
  apiContext: { user: { id: 'user-1' } },
  getAllJobs: async () => jobs,
  hasObject: id => id !== 'vm-gone',
  getObject: id => ({ $poolId: id === 'vm-1' ? POOL_ID : 'pool-2' }),
})

describe('backupGuard', function () {
  it('refuses the operation while a backup job runs on the pool', async function () {
    const app = createApp([{ runId: 'run-1', vms: { id: 'vm-1' } }])
    await assert.rejects(backupGuard.call(app, POOL_ID), forbiddenOperation.is)
  })

  it('lets the operation through when no backup job runs on the pool', async function () {
    await backupGuard.call(createApp([{ vms: { id: 'vm-1' } }, { runId: 'run-2', vms: { id: 'vm-2' } }]), POOL_ID)
  })

  it('ignores the VMs of a running job that no longer exist', async function () {
    const running = ids => createApp([{ runId: 'run-1', vms: { id: { __or: ids } } }])
    await backupGuard.call(running(['vm-gone', 'vm-2']), POOL_ID)
    await assert.rejects(backupGuard.call(running(['vm-gone', 'vm-1']), POOL_ID), forbiddenOperation.is)
  })

  it('decides from the pool pattern of a running smart mode job', async function () {
    const running = vms => createApp([{ runId: 'run-1', vms }])
    await backupGuard.call(running({ $pool: { __or: ['pool-2'] } }), POOL_ID)
    await assert.rejects(backupGuard.call(running({ $pool: { __or: [POOL_ID] } }), POOL_ID), forbiddenOperation.is)
    // no pool pattern: the job may target any pool
    await assert.rejects(backupGuard.call(running({ power_state: 'Running' }), POOL_ID), forbiddenOperation.is)
  })

  it('skips the check and logs who bypassed it when bypassBackupCheck is set', async function () {
    const app = createApp([{ runId: 'run-1', vms: { id: 'vm-1' } }])
    await backupGuard.call(app, POOL_ID, { bypassBackupCheck: true, operation: 'rollingPoolUpdate' })
    const [log] = transport.logs.filter(({ message }) => message.includes('bypassBackupCheck'))
    assert.match(log.message, /^rollingPoolUpdate /)
    assert.deepEqual(log.data, { poolId: POOL_ID, userId: 'user-1' })
  })
})
