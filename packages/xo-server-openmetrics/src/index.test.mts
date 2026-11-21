/**
 * Tests for the plugin configuration (Prometheus secret handling)
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { setImmediate } from 'node:timers/promises'

import type { AnyXoJob, AnyXoLog } from '@vates/types'

import { configurationSchema, ensureSecret, selectBackupJobLastRuns, TtlCache } from './index.mjs'

describe('configurationSchema', () => {
  it('does not generate the secret as a schema default', () => {
    // a `default` here is re-evaluated on every module load and never persisted
    // by xo-server, which used to change the Prometheus secret at each restart
    assert.equal((configurationSchema.properties.secret as Record<string, unknown>).default, undefined)
  })
})

describe('ensureSecret', () => {
  it('generates and persists a secret when none is configured', async () => {
    const persisted: unknown[] = []
    const secret = await ensureSecret(undefined, async configuration => {
      persisted.push(configuration)
    })

    assert.match(secret, /^[0-9a-f]{64}$/)
    assert.deepEqual(persisted, [{ secret }])
  })

  it('generates and persists a secret when the configured one is empty', async () => {
    const persisted: unknown[] = []
    const secret = await ensureSecret({ secret: '' }, async configuration => {
      persisted.push(configuration)
    })

    assert.match(secret, /^[0-9a-f]{64}$/)
    assert.deepEqual(persisted, [{ secret }])
  })

  it('keeps the configured secret and persists nothing', async () => {
    const persisted: unknown[] = []
    const secret = await ensureSecret({ secret: 'cafecafecafecafe' }, async configuration => {
      persisted.push(configuration)
    })

    assert.equal(secret, 'cafecafecafecafe')
    assert.deepEqual(persisted, [])
  })
})

describe('TtlCache', () => {
  it('waits for the first load', async () => {
    const cache = new TtlCache<string>('test', 0)
    assert.equal(await cache.get(async () => 'a'), 'a')
  })

  it('serves the expired snapshot immediately and reloads in the background', async () => {
    // ttl 0: every snapshot is expired by the next call
    const cache = new TtlCache<string>('test', 0)
    await cache.get(async () => 'a')

    // a hanging loader (e.g. ipmitool.py on a dead BMC) must not delay the caller:
    // the stale value must come back before the event loop turns
    const stale = cache.get(() => new Promise(() => {}))
    assert.equal(await Promise.race([stale, setImmediate('still waiting')]), 'a')
  })

  it('serves the reloaded value once the reload lands', async () => {
    const cache = new TtlCache<string>('test', 0)
    await cache.get(async () => 'a')
    assert.equal(await cache.get(async () => 'b'), 'a')
    // let the settled reload run its continuations inside the cache
    await setImmediate()
    assert.equal(await cache.get(() => new Promise(() => {})), 'b')
  })

  it('rejects the caller when the first load fails, then retries', async () => {
    const cache = new TtlCache<string>('test', 0)
    await assert.rejects(
      cache.get(() => Promise.reject(new Error('boom'))),
      { message: 'boom' }
    )
    assert.equal(await cache.get(async () => 'a'), 'a')
  })

  it('drops the snapshot when a background reload fails, so the next call reports the error', async () => {
    const cache = new TtlCache<string>('test', 0)
    await cache.get(async () => 'a')
    assert.equal(await cache.get(() => Promise.reject(new Error('boom'))), 'a')
    await setImmediate()
    await assert.rejects(
      cache.get(() => Promise.reject(new Error('again'))),
      { message: 'again' }
    )
  })

  it('shares one reload between callers while it is in flight', async () => {
    let loads = 0
    const cache = new TtlCache<string>('test', 0)
    await cache.get(async () => 'a')
    const load = () => {
      ++loads
      return new Promise<string>(() => {})
    }
    await cache.get(load)
    await cache.get(load)
    assert.equal(loads, 1)
  })
})

describe('selectBackupJobLastRuns', () => {
  const job = (props: Record<string, unknown>) =>
    ({ id: 'job-1', name: 'Nightly', type: 'backup', ...props }) as unknown as AnyXoJob
  const jobs = [job({})]
  const backupLog = (props: Record<string, unknown>) =>
    ({
      id: `log-${props.start}`,
      message: 'backup',
      jobId: 'job-1',
      status: 'success',
      ...props,
    }) as unknown as AnyXoLog

  it('keeps the run that ended last, not the one that started last', () => {
    const runs = selectBackupJobLastRuns(jobs, [
      backupLog({ start: 1000, end: 5000, status: 'success' }),
      // refused because the job is already running: starts later, ends earlier
      backupLog({ start: 2000, end: 2001, status: 'failure' }),
    ])

    assert.deepEqual(runs, [
      { jobId: 'job-1', jobName: 'Nightly', jobType: 'backup', status: 'success', start: 1000, end: 5000 },
    ])
  })

  it('keeps the last finished run while another run is in progress', () => {
    const runs = selectBackupJobLastRuns(jobs, [
      backupLog({ start: 1000, end: 2000, status: 'failure' }),
      backupLog({ start: 3000, status: 'pending' }),
    ])

    assert.equal(runs.length, 1)
    assert.equal(runs[0]!.end, 2000)
  })

  it('ignores restore logs, runs without end and runs of unknown jobs', () => {
    const runs = selectBackupJobLastRuns(jobs, [
      backupLog({ message: 'restore', start: 1000, end: 2000 }),
      backupLog({ start: 3000, status: 'interrupted' }),
      backupLog({ jobId: 'deleted-job', start: 4000, end: 5000 }),
    ])

    assert.deepEqual(runs, [])
  })

  it('ignores jobs that are not backup jobs, such as sequences', () => {
    const runs = selectBackupJobLastRuns(
      [job({ id: 'sequence-1', type: 'call', method: 'schedule.runSequence' })],
      [backupLog({ jobId: 'sequence-1', start: 1000, end: 2000 })]
    )

    assert.deepEqual(runs, [])
  })

  it('ignores runs with an invalid end or an end before their start', () => {
    const runs = selectBackupJobLastRuns(jobs, [
      backupLog({ start: 1000, end: NaN }),
      backupLog({ start: 2000, end: Infinity }),
      // system clock set back during the run
      backupLog({ start: 6000, end: 3000 }),
      backupLog({ start: 4000, end: 5000 }),
    ])

    assert.deepEqual(
      runs.map(run => run.end),
      [5000]
    )
  })

  it('ignores runs with a status that is not a final status', () => {
    const runs = selectBackupJobLastRuns(jobs, [
      backupLog({ start: 1000, end: 2000 }),
      backupLog({ start: 3000, end: 4000, status: 'pending' }),
    ])

    assert.deepEqual(
      runs.map(run => run.end),
      [2000]
    )
  })

  it('restores job names that the job collection parsed as JSON', () => {
    const nameOf = (name: unknown) =>
      selectBackupJobLastRuns([job({ name })], [backupLog({ start: 1000, end: 2000 })])[0]!.jobName

    // a job named `2024` is read back as the number 2024
    assert.equal(nameOf(2024), '2024')
    assert.equal(nameOf(true), 'true')
    assert.equal(nameOf('Nightly'), 'Nightly')
    // names that cannot be restored are dropped, the job keeps its `job_id`
    assert.equal(nameOf({ a: 1 }), '')
    assert.equal(nameOf([1, 2]), '')
    assert.equal(nameOf(null), '')
  })
})
