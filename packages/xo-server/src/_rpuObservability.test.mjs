import assert from 'assert/strict'
import test from 'node:test'
import { mkdtemp, readFile, stat, utimes, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { gcRpuTraces, makeReplacer, openRpuTrace, reconcileRpuTraces } from './_rpuObservability.mjs'

const { describe, it, beforeEach } = test

const makeFakeTask = () => {
  const events = []
  return { events, status: 'pending', _onProgress: event => events.push(event) }
}

let dir
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'rpu-observability-'))
})

describe('makeReplacer', function () {
  const serialize = value => JSON.stringify(value, makeReplacer())

  it('serializes errors with message, name and stack', function () {
    const parsed = JSON.parse(serialize({ result: new Error('boom') }))
    assert.equal(parsed.result.message, 'boom')
    assert.equal(parsed.result.name, 'Error')
    assert.ok(parsed.result.stack.includes('boom'))
  })

  it('converts BigInt to string', function () {
    assert.equal(serialize({ size: 42n }), '{"size":"42"}')
  })

  it('breaks cycles', function () {
    const value = { name: 'a' }
    value.self = value
    assert.equal(serialize(value), '{"name":"a","self":"[Circular]"}')
  })

  it('scrubs sensitive keys', function () {
    const parsed = JSON.parse(
      serialize({
        apikey: 'S',
        api_key: 'S',
        name: 'a',
        password: 'hunter2',
        sessionId: 'abc',
        xsCredentials: { username: 'u' },
      })
    )
    assert.equal(parsed.name, 'a')
    assert.equal(parsed.apikey, '[REDACTED]')
    assert.equal(parsed.api_key, '[REDACTED]')
    assert.equal(parsed.password, '[REDACTED]')
    assert.equal(parsed.sessionId, '[REDACTED]')
    assert.equal(parsed.xsCredentials, '[REDACTED]')
  })
})

describe('openRpuTrace', function () {
  it('tees events to a NDJSON trace and keeps calling the inner onProgress', async function () {
    const task = makeFakeTask()
    const trace = openRpuTrace({ dir, kind: 'rpu', poolId: 'pool-1' })
    trace.attach(task)

    task._onProgress({ type: 'start', id: 't1' })
    task._onProgress({ type: 'end', id: 't1', status: 'success' })
    trace.stop()

    const lines = (await readFile(trace.traceFile, 'utf8')).trim().split('\n')
    assert.deepEqual(lines.map(JSON.parse), [
      { type: 'start', id: 't1' },
      { type: 'end', id: 't1', status: 'success' },
    ])
    assert.equal(task.events.length, 2)
  })

  it('scrubs sensitive property events without altering what the task machinery receives', async function () {
    const task = makeFakeTask()
    const trace = openRpuTrace({ dir, kind: 'rpu', poolId: 'pool-1' })
    trace.attach(task)

    const secret = { apikey: 'SECRET' }
    task._onProgress({ type: 'property', name: 'xsCredentials', value: secret, id: 't1' })
    trace.stop()

    const content = await readFile(trace.traceFile, 'utf8')
    assert.ok(!content.includes('SECRET'))
    assert.ok(content.includes('[REDACTED]'))
    // the inner onProgress still receives the original, untouched event
    assert.equal(task.events[0].value, secret)
  })

  it('writes a heartbeat with lastUpdated and status, updated on stop', async function () {
    const task = makeFakeTask()
    const trace = openRpuTrace({ dir, kind: 'rpu', poolId: 'pool-1' })
    trace.attach(task)

    let heartbeat = JSON.parse(await readFile(trace.heartbeatFile, 'utf8'))
    assert.equal(heartbeat.status, 'pending')
    assert.equal(heartbeat.degraded, undefined)
    assert.ok(!Number.isNaN(Date.parse(heartbeat.lastUpdated)))

    task.status = 'success'
    trace.stop()
    heartbeat = JSON.parse(await readFile(trace.heartbeatFile, 'utf8'))
    assert.equal(heartbeat.status, 'success')
  })

  it('flags the heartbeat as degraded when trace writes fail', async function () {
    const task = makeFakeTask()
    const trace = openRpuTrace({ dir, kind: 'rpu', poolId: 'pool-1' })
    trace.attach(task)

    // a throwing getter makes the serialization fail: the error must be
    // swallowed and surfaced through the heartbeat's degraded flag
    task._onProgress({
      type: 'info',
      id: 't1',
      get data() {
        throw new Error('boom')
      },
    })
    assert.equal(task.events.length, 1)

    trace.stop()
    const heartbeat = JSON.parse(await readFile(trace.heartbeatFile, 'utf8'))
    assert.equal(heartbeat.degraded, true)
  })

  it('sanitizes the pool id in file names', function () {
    const trace = openRpuTrace({ dir, kind: 'rpr', poolId: '../../etc/passwd' })
    assert.ok(trace.traceFile.startsWith(join(dir, 'rpr-etcpasswd-')))
    trace.stop()
  })

  it('never throws into the task, even after stop', function () {
    const task = makeFakeTask()
    const trace = openRpuTrace({ dir, kind: 'rpu', poolId: 'pool-1' })
    trace.attach(task)
    trace.stop()
    trace.stop() // idempotent

    // fd is closed: the write is skipped but the event still reaches the
    // inner onProgress and nothing is thrown
    task._onProgress({ type: 'info', id: 't1' })
    assert.equal(task.events.length, 1)
  })

  it('returns undefined when the trace files cannot be created', async function () {
    // a path whose parent is a regular file fails with ENOTDIR
    const file = join(dir, 'not-a-dir')
    await writeFile(file, '')
    assert.equal(openRpuTrace({ dir: join(file, 'sub'), kind: 'rpu', poolId: 'pool-1' }), undefined)
  })

  it('creates the traces directory and files with restrictive permissions', async function () {
    const nested = join(dir, 'nested')
    const trace = openRpuTrace({ dir: nested, kind: 'rpu', poolId: 'pool-1' })
    trace.attach(makeFakeTask())
    trace.stop()
    assert.equal((await stat(nested)).mode & 0o777, 0o700)
    assert.equal((await stat(trace.traceFile)).mode & 0o777, 0o600)
    assert.equal((await stat(trace.heartbeatFile)).mode & 0o777, 0o600)
  })
})

describe('gcRpuTraces', function () {
  it('deletes only expired RPU/RPR files', async function () {
    const old = new Date(Date.now() - 3600e3)
    const oldTrace = join(dir, 'rpu-pool-1-20260101T000000000Z.ndjson')
    const oldHeartbeat = join(dir, 'rpr-pool-1-20260101T000000000Z.heartbeat.json')
    const oldTmp = join(dir, 'rpr-pool-1-20260101T000000000Z.heartbeat.json.tmp')
    const oldWrongExtension = join(dir, 'rpu-pool-1-20260101T000000000Z.log')
    const recentTrace = join(dir, 'rpu-pool-2-20260706T000000000Z.ndjson')
    const unrelated = join(dir, 'unrelated.ndjson')
    for (const path of [oldTrace, oldHeartbeat, oldTmp, oldWrongExtension, recentTrace, unrelated]) {
      await writeFile(path, '')
      if (path !== recentTrace) {
        await utimes(path, old, old)
      }
    }

    await gcRpuTraces(dir, 1800e3)

    assert.equal(existsSync(oldTrace), false)
    assert.equal(existsSync(oldHeartbeat), false)
    assert.equal(existsSync(oldTmp), false)
    assert.equal(existsSync(oldWrongExtension), true)
    assert.equal(existsSync(recentTrace), true)
    assert.equal(existsSync(unrelated), true)
  })

  it('never deletes the files of a trace still being written', async function () {
    const task = makeFakeTask()
    const trace = openRpuTrace({ dir, kind: 'rpu', poolId: 'pool-1' })
    trace.attach(task)

    const old = new Date(Date.now() - 3600e3)
    await utimes(trace.traceFile, old, old)
    await utimes(trace.heartbeatFile, old, old)

    await gcRpuTraces(dir, 0)
    assert.equal(existsSync(trace.traceFile), true)
    assert.equal(existsSync(trace.heartbeatFile), true)

    trace.stop()
    await utimes(trace.traceFile, old, old)
    await utimes(trace.heartbeatFile, old, old)
    await gcRpuTraces(dir, 1800e3)
    assert.equal(existsSync(trace.traceFile), false)
    assert.equal(existsSync(trace.heartbeatFile), false)
  })

  it('does not throw on a missing directory', async function () {
    await gcRpuTraces(join(dir, 'does-not-exist'), 0)
  })
})

describe('reconcileRpuTraces', function () {
  it('stamps pending heartbeats as interrupted, preserving the time of death', async function () {
    const path = join(dir, 'rpu-pool-1-20260101T000000000Z.heartbeat.json')
    await writeFile(path, JSON.stringify({ lastUpdated: '2026-01-01T00:00:00.000Z', status: 'pending' }))

    await reconcileRpuTraces(dir)

    const heartbeat = JSON.parse(await readFile(path, 'utf8'))
    assert.equal(heartbeat.status, 'interrupted')
    assert.equal(heartbeat.lastAlive, '2026-01-01T00:00:00.000Z')
    assert.ok(!Number.isNaN(Date.parse(heartbeat.lastUpdated)))
  })

  it('leaves finished heartbeats untouched', async function () {
    const path = join(dir, 'rpu-pool-1-20260101T000000000Z.heartbeat.json')
    const content = JSON.stringify({ lastUpdated: '2026-01-01T00:00:00.000Z', status: 'failure' })
    await writeFile(path, content)

    await reconcileRpuTraces(dir)

    assert.equal(await readFile(path, 'utf8'), content)
  })

  it('skips the heartbeat of a run in progress', async function () {
    const task = makeFakeTask()
    const trace = openRpuTrace({ dir, kind: 'rpu', poolId: 'pool-1' })
    trace.attach(task)

    await reconcileRpuTraces(dir)

    const heartbeat = JSON.parse(await readFile(trace.heartbeatFile, 'utf8'))
    assert.equal(heartbeat.status, 'pending')
    trace.stop()
  })

  it('does not throw on a corrupt heartbeat or a missing directory', async function () {
    await writeFile(join(dir, 'rpu-pool-1-20260101T000000000Z.heartbeat.json'), '{truncated')
    await reconcileRpuTraces(dir)
    await reconcileRpuTraces(join(dir, 'does-not-exist'))
  })
})
