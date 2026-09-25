import assert from 'node:assert/strict'
import { PassThrough } from 'node:stream'
import { describe, it } from 'node:test'

import { DockerError } from './errors.mjs'
import { DockerStatsSampler } from './stats-sampler.mjs'

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const tick = () => new Promise(resolve => setImmediate(resolve))

// a Docker stats object: `total` / `system` are the cumulated CPU counters,
// `pre` the previous ones (absent on the first object of a stream)
const statsObject = ({ total, system, pre, memory = 100e6 }) => ({
  read: '2026-09-24T12:00:00.000000000Z',
  cpu_stats: { cpu_usage: { total_usage: total }, system_cpu_usage: system, online_cpus: 2 },
  precpu_stats: pre === undefined ? { cpu_usage: { total_usage: 0 } } : pre,
  memory_stats: { usage: memory, limit: 1e9, stats: { inactive_file: 0 } },
  pids_stats: { current: 3 },
})

/**
 * Fake `openStream()`: one PassThrough per call, controllable from the test.
 */
function createFakeDocker() {
  const streams = new Map()
  const opened = []
  const fake = {
    opened,
    streams,
    fail: undefined, // (dockerId) => Error | undefined
    openStream: async (dockerId, signal) => {
      opened.push(dockerId)
      await tick()
      const error = fake.fail?.(dockerId)
      if (error !== undefined) {
        throw error
      }
      const stream = new PassThrough()
      signal.addEventListener('abort', () => stream.destroy(), { once: true })
      streams.set(dockerId, stream)
      return stream
    },
    push(dockerId, object) {
      streams.get(dockerId).write(JSON.stringify(object) + '\n')
    },
    isOpen(dockerId) {
      const stream = streams.get(dockerId)
      return stream !== undefined && !stream.destroyed
    },
  }
  return fake
}

describe('DockerStatsSampler', () => {
  it('warms up: pending until the second sample, which has the CPU usage', async () => {
    const fake = createFakeDocker()
    const sampler = new DockerStatsSampler({ openStream: fake.openStream })
    try {
      sampler.sync(['a'])
      // never blocks: known but no sample yet
      assert.deepEqual(sampler.get('a'), { stats: undefined, pending: true })
      await tick()
      await tick()

      fake.push('a', statsObject({ total: 1e9, system: 100e9 }))
      await tick()
      let sample = sampler.get('a')
      assert.equal(sample.pending, true)
      assert.equal(sample.stats.cpuPercent, null)
      assert.equal(sample.stats.memoryUsage, 100e6)

      // 0.5 s of CPU over 10 s of system time on 2 CPUs → 10 %
      fake.push(
        'a',
        statsObject({
          total: 1.5e9,
          system: 110e9,
          pre: { cpu_usage: { total_usage: 1e9 }, system_cpu_usage: 100e9 },
        })
      )
      await tick()
      sample = sampler.get('a')
      assert.equal(sample.pending, false)
      assert.equal(sample.stats.cpuPercent, 10)
      assert.equal(sampler.get('unknown'), undefined)
    } finally {
      sampler.stop()
    }
  })

  it('keeps only the latest sample, and handles objects split across chunks', async () => {
    const fake = createFakeDocker()
    const sampler = new DockerStatsSampler({ openStream: fake.openStream })
    try {
      sampler.sync(['a'])
      await tick()
      await tick()
      const line = JSON.stringify(statsObject({ total: 1, system: 1, memory: 42 })) + '\n'
      const stream = fake.streams.get('a')
      for (let i = 0; i < line.length; i += 7) {
        stream.write(line.slice(i, i + 7))
        await tick()
      }
      assert.equal(sampler.get('a').stats.memoryUsage, 42)
      fake.push('a', statsObject({ total: 2, system: 2, memory: 43 }))
      await tick()
      assert.equal(sampler.get('a').stats.memoryUsage, 43)
    } finally {
      sampler.stop()
    }
  })

  it('follows the containers: new streams opened, stopped ones closed', async () => {
    const fake = createFakeDocker()
    const sampler = new DockerStatsSampler({ openStream: fake.openStream })
    try {
      sampler.sync(['a', 'b'])
      await tick()
      await tick()
      assert.deepEqual(fake.opened, ['a', 'b'])
      assert.equal(sampler.size, 2)

      sampler.sync(['b', 'c'])
      await tick()
      await tick()
      assert.deepEqual(fake.opened, ['a', 'b', 'c'], 'b is not reopened')
      assert.equal(fake.isOpen('a'), false, 'a is closed')
      assert.equal(fake.isOpen('b'), true)
      assert.equal(fake.isOpen('c'), true)
      assert.equal(sampler.has('a'), false)
      assert.equal(sampler.size, 2)
    } finally {
      sampler.stop()
    }
  })

  it('a stream which ends (container stopped) is dropped, and reopened only after retryDelay', async () => {
    const fake = createFakeDocker()
    const sampler = new DockerStatsSampler({ openStream: fake.openStream, retryDelay: 50 })
    try {
      sampler.sync(['a'])
      await tick()
      await tick()
      fake.streams.get('a').end()
      await tick()
      await tick()
      assert.equal(sampler.has('a'), false)
      sampler.sync(['a'])
      assert.equal(sampler.has('a'), false, 'not retried right away')
      await sleep(60)
      sampler.sync(['a'])
      assert.equal(sampler.has('a'), true)
      assert.deepEqual(fake.opened, ['a', 'a'])
    } finally {
      sampler.stop()
    }
  })

  it('a Docker API error (e.g. 404) drops only that container', async () => {
    const fake = createFakeDocker()
    fake.fail = id => (id === 'gone' ? new DockerError('DOCKER_API_ERROR', 'no such container') : undefined)
    const sampler = new DockerStatsSampler({ openStream: fake.openStream })
    try {
      sampler.sync(['gone', 'a'])
      await tick()
      await tick()
      assert.equal(sampler.stopped, false)
      assert.equal(sampler.has('gone'), false)
      assert.equal(sampler.has('a'), true)
    } finally {
      sampler.stop()
    }
  })

  it('an engine failure stops the sampler, onStop gets the error', async () => {
    const fake = createFakeDocker()
    const error = new DockerError('SSH_UNREACHABLE', 'connection lost')
    fake.fail = () => error
    let stopError = 'not called'
    const sampler = new DockerStatsSampler({
      openStream: fake.openStream,
      onStop: error => {
        stopError = error
      },
    })
    sampler.sync(['a', 'b'])
    await tick()
    await tick()
    assert.equal(sampler.stopped, true)
    assert.equal(stopError, error)
    assert.equal(sampler.size, 0)
  })

  it('at most maxContainers streams, already streamed containers are kept first', async () => {
    const fake = createFakeDocker()
    const sampler = new DockerStatsSampler({ openStream: fake.openStream, maxContainers: 2 })
    try {
      sampler.sync(['a', 'b', 'c'])
      await tick()
      await tick()
      assert.deepEqual(fake.opened, ['a', 'b'])
      assert.equal(sampler.get('c'), undefined)

      // c comes first now, but a and b are kept
      sampler.sync(['c', 'b', 'a'])
      await tick()
      assert.deepEqual(fake.opened, ['a', 'b'])

      // a is gone: c takes its place
      sampler.sync(['c', 'b'])
      await tick()
      await tick()
      assert.deepEqual(fake.opened, ['a', 'b', 'c'])
      assert.equal(sampler.size, 2)
    } finally {
      sampler.stop()
    }
  })

  it('an oversized object drops the stream (bounded memory)', async () => {
    const fake = createFakeDocker()
    const sampler = new DockerStatsSampler({ openStream: fake.openStream, maxObjectSize: 100 })
    try {
      sampler.sync(['a'])
      await tick()
      await tick()
      fake.streams.get('a').write('x'.repeat(200))
      await tick()
      await tick()
      assert.equal(sampler.has('a'), false)
      assert.equal(fake.isOpen('a'), false)
    } finally {
      sampler.stop()
    }
  })

  it('stops after idleTimeout without reader, readers keep it alive', async () => {
    const fake = createFakeDocker()
    let stops = 0
    const sampler = new DockerStatsSampler({
      openStream: fake.openStream,
      idleTimeout: 80,
      onStop: () => ++stops,
    })
    sampler.sync(['a'])
    await tick()
    await tick()
    for (let i = 0; i < 4; ++i) {
      await sleep(40)
      sampler.get('a')
    }
    assert.equal(sampler.stopped, false, 'kept alive by get()')
    await sleep(150)
    assert.equal(sampler.stopped, true)
    assert.equal(stops, 1)
    assert.equal(fake.isOpen('a'), false, 'streams closed')
    // no effect once stopped
    sampler.sync(['a'])
    assert.equal(sampler.get('a'), undefined)
    assert.deepEqual(fake.opened, ['a'])
  })

  it('stop() closes every stream, including the ones being opened', async () => {
    const fake = createFakeDocker()
    let stops = 0
    const sampler = new DockerStatsSampler({ openStream: fake.openStream, onStop: () => ++stops })
    sampler.sync(['a'])
    await tick()
    await tick()
    sampler.sync(['a', 'b']) // b is being opened
    sampler.stop()
    sampler.stop()
    await tick()
    await tick()
    assert.equal(stops, 1)
    assert.equal(fake.isOpen('a'), false)
    assert.equal(fake.isOpen('b'), false)
    assert.equal(sampler.size, 0)
  })
})
