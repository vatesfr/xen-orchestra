import assert from 'node:assert/strict'
import test from 'node:test'

import { CONTAINER_LIST, INSPECT_BY_NAME } from './fixtures/containers.mjs'
import { INFO, VERSION } from './fixtures/engine.mjs'
import { STATS_BUSY, STATS_EXITED, STATS_NGINX_IDLE, STATS_PAUSED, STATS_STREAM_NGINX } from './fixtures/stats.mjs'
import {
  CONTAINER_STATES,
  computeCpuPercent,
  computeMemoryUsage,
  getComposeInfo,
  getContainerName,
  normalizeContainerInspect,
  normalizeContainerListEntry,
  normalizeContainerStats,
  normalizeEngineInfo,
  normalizeInspectPorts,
  normalizeListPorts,
  parseContainerStatus,
  parseDockerDate,
} from './normalize.mjs'
import type { DockerCpuStats, DockerPort, DockerStatsSample } from './wire.mjs'

const { describe, it } = test

// the copies of stats are typed `DockerStatsSample`, whose values are `unknown`:
// the tests change them like a hostile daemon would
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value))

// `!`: the fixtures contain these containers
const listEntry = (name: string) => CONTAINER_LIST.find(entry => entry.Names!.includes('/' + name))!
const listed = (name: string) => normalizeContainerListEntry(listEntry(name))
const inspected = (name: string) => normalizeContainerInspect(INSPECT_BY_NAME[name])

describe('parseDockerDate()', () => {
  it('parses RFC 3339 dates with nanoseconds', () => {
    assert.equal(parseDockerDate('2026-09-24T16:54:40.2704229Z'), Date.UTC(2026, 8, 24, 16, 54, 40, 270))
  })

  it('returns undefined for Go zero dates and invalid values', () => {
    assert.equal(parseDockerDate('0001-01-01T00:00:00Z'), undefined)
    assert.equal(parseDockerDate(''), undefined)
    assert.equal(parseDockerDate(undefined), undefined)
    assert.equal(parseDockerDate('not a date'), undefined)
  })
})

describe('getContainerName()', () => {
  it('strips the leading slash', () => {
    assert.equal(getContainerName(['/xo-nginx']), 'xo-nginx')
  })

  it('ignores legacy link aliases', () => {
    assert.equal(getContainerName(['/web/db', '/db']), 'db')
  })

  it('handles missing names', () => {
    assert.equal(getContainerName([]), undefined)
    assert.equal(getContainerName(undefined), undefined)
  })
})

describe('parseContainerStatus()', () => {
  const cases: [string | undefined, object][] = [
    ['Exited (3) 2 minutes ago', { exitCode: 3 }],
    ['Exited (0) 8 seconds ago', { exitCode: 0 }],
    ['Exited (137) About an hour ago', { exitCode: 137 }],
    ['Exited (-1) 1 second ago', { exitCode: -1 }],
    ['Restarting (1) 3 seconds ago', { exitCode: 1 }],
    ['Up 2 minutes', {}],
    ['Up 2 minutes (healthy)', { health: 'healthy' }],
    ['Up 2 minutes (unhealthy)', { health: 'unhealthy' }],
    ['Up 1 second (health: starting)', { health: 'starting' }],
    ['Up 2 minutes (Paused)', {}],
    ['Created', {}],
    ['Dead', {}],
    ['Removal In Progress', {}],
    [undefined, {}],
  ]
  for (const [status, expected] of cases) {
    it(String(status), () => {
      assert.deepEqual(parseContainerStatus(status), expected)
    })
  }

  it('parses the real statuses', () => {
    for (const entry of CONTAINER_LIST) {
      const { exitCode } = parseContainerStatus(entry.Status)
      const inspect = INSPECT_BY_NAME[getContainerName(entry.Names)!]
      if (entry.State === 'exited') {
        assert.equal(exitCode, inspect.State!.ExitCode)
      } else {
        assert.equal(exitCode, undefined)
      }
    }
  })
})

describe('ports', () => {
  it('dedupes 0.0.0.0 and :: bindings of the same port', () => {
    assert.deepEqual(listed('xo-nginx').ports, [{ ip: '0.0.0.0', privatePort: 80, publicPort: 8080, protocol: 'tcp' }])
    assert.deepEqual(inspected('xo-nginx').ports, listed('xo-nginx').ports)
  })

  it('keeps loopback, UDP and unpublished ports, sorted', () => {
    const expected = [
      { ip: '0.0.0.0', privatePort: 53, publicPort: 5353, protocol: 'udp' },
      { ip: '127.0.0.1', privatePort: 80, publicPort: 9090, protocol: 'tcp' },
    ]
    assert.deepEqual(listed('xo-cap-busy').ports, expected)
    assert.deepEqual(inspected('xo-cap-busy').ports, expected)
    // exposed, not published
    assert.deepEqual(listed('demo-cache-1').ports, [{ privatePort: 6379, protocol: 'tcp' }])
    assert.deepEqual(inspected('xo-healthy').ports, [{ privatePort: 80, protocol: 'tcp' }])
  })

  it('keeps IPv6-only bindings and specific addresses', () => {
    assert.deepEqual(
      normalizeListPorts([
        { IP: '::', PrivatePort: 80, PublicPort: 8080, Type: 'tcp' },
        { IP: '192.0.2.1', PrivatePort: 80, PublicPort: 8081, Type: 'tcp' },
        { IP: '::1', PrivatePort: 80, PublicPort: 8081, Type: 'tcp' },
        // the IPv4 wildcard of another public port does not hide it
        { IP: '0.0.0.0', PrivatePort: 80, PublicPort: 8082, Type: 'tcp' },
      ]),
      [
        { ip: '::', privatePort: 80, publicPort: 8080, protocol: 'tcp' },
        { ip: '::1', privatePort: 80, publicPort: 8081, protocol: 'tcp' },
        { ip: '192.0.2.1', privatePort: 80, publicPort: 8081, protocol: 'tcp' },
        { ip: '0.0.0.0', privatePort: 80, publicPort: 8082, protocol: 'tcp' },
      ]
    )
  })

  it('removes exact duplicates and handles missing values', () => {
    const port: DockerPort = { IP: '0.0.0.0', PrivatePort: 80, PublicPort: 8080, Type: 'tcp' }
    assert.deepEqual(normalizeListPorts([port, { ...port }]), [
      { ip: '0.0.0.0', privatePort: 80, publicPort: 8080, protocol: 'tcp' },
    ])
    assert.deepEqual(normalizeListPorts(undefined), [])
    assert.deepEqual(normalizeInspectPorts(undefined), [])
    assert.deepEqual(normalizeInspectPorts({ '80/tcp': [], 443: null }), [
      { privatePort: 80, protocol: 'tcp' },
      { privatePort: 443, protocol: 'tcp' },
    ])
  })
})

describe('getComposeInfo()', () => {
  it('extracts the project and service', () => {
    assert.deepEqual(listed('demo-web-1').compose, {
      project: 'demo',
      service: 'web',
      containerNumber: 1,
      oneOff: false,
      workingDir: '/srv/compose-demo',
      configFiles: ['/srv/compose-demo/compose.yaml'],
    })
    assert.deepEqual(inspected('demo-web-1').compose, listed('demo-web-1').compose)
    assert.equal(listed('demo-cache-1').compose!.service, 'cache')
  })

  it('is undefined outside of a Compose project', () => {
    assert.equal(listed('xo-nginx').compose, undefined)
    assert.equal(getComposeInfo(undefined), undefined)
    assert.equal(getComposeInfo({ 'com.docker.compose.project': '' }), undefined)
  })

  it('only requires the project label', () => {
    assert.deepEqual(
      getComposeInfo({
        'com.docker.compose.project': 'p',
        'com.docker.compose.oneoff': 'True',
        'com.docker.compose.project.config_files': 'a.yaml,b.yaml',
      }),
      { project: 'p', oneOff: true, configFiles: ['a.yaml', 'b.yaml'] }
    )
  })
})

describe('normalizeContainerListEntry()', () => {
  it('normalizes a running container', () => {
    const entry = listEntry('xo-nginx')
    assert.deepEqual(listed('xo-nginx'), {
      dockerId: entry.Id,
      name: 'xo-nginx',
      image: 'nginx:alpine',
      imageId: entry.ImageID,
      command: "/docker-entrypoint.sh nginx -g 'daemon off;'",
      createdAt: entry.Created * 1e3,
      state: 'running',
      status: entry.Status,
      exitCode: undefined,
      health: undefined,
      ports: [{ ip: '0.0.0.0', privatePort: 80, publicPort: 8080, protocol: 'tcp' }],
      labels: entry.Labels,
      compose: undefined,
      networks: [{ name: 'bridge', ipAddress: '172.17.0.2' }],
      mounts: [],
    })
  })

  it('gives the exit code of exited containers only', () => {
    assert.equal(listed('xo-exited').state, 'exited')
    assert.equal(listed('xo-exited').exitCode, 3)
    assert.equal(listed('xo-tty').exitCode, 0)
    assert.equal(listed('xo-cap-created').state, 'created')
    assert.equal(listed('xo-cap-created').exitCode, undefined)
  })

  it('gives the health status', () => {
    assert.equal(listed('xo-healthy').health, 'healthy')
    assert.equal(listed('xo-unhealthy').health, 'unhealthy')
    assert.equal(listed('xo-paused').state, 'paused')
    assert.equal(listed('xo-paused').health, undefined)
  })

  it('normalizes mounts', () => {
    assert.deepEqual(listed('xo-cap-busy').mounts, [
      {
        type: 'volume',
        name: 'xo-cap-vol',
        source: '/home/docker/.local/share/docker/volumes/xo-cap-vol/_data',
        destination: '/data',
        readOnly: false,
      },
      { type: 'bind', source: '/etc/hostname', destination: '/host-hostname', readOnly: true },
    ])
    assert.deepEqual(inspected('xo-cap-busy').mounts, listed('xo-cap-busy').mounts)
  })

  it('only gives known states', () => {
    for (const entry of CONTAINER_LIST) {
      assert.ok(CONTAINER_STATES.includes(normalizeContainerListEntry(entry).state))
    }
  })
})

describe('normalizeContainerInspect()', () => {
  it('is consistent with the list entry', () => {
    for (const entry of CONTAINER_LIST) {
      const name = getContainerName(entry.Names)!
      const { status, createdAt, ...fromList } = normalizeContainerListEntry(entry)
      const fromInspect = inspected(name)
      for (const [key, value] of Object.entries(fromList)) {
        assert.deepEqual(fromInspect[key as keyof typeof fromInspect], value, `${name}: ${key}`)
      }
      assert.equal(Math.floor(fromInspect.createdAt! / 1e3) * 1e3, createdAt)
    }
  })

  it('gives the details of a running container', () => {
    const container = inspected('xo-cap-busy')
    assert.equal(container.startedAt, Date.parse(INSPECT_BY_NAME['xo-cap-busy'].State!.StartedAt!))
    assert.equal(container.finishedAt, undefined)
    assert.deepEqual(container.restartPolicy, { name: 'unless-stopped', maximumRetryCount: 0 })
    assert.equal(container.restartCount, 0)
    assert.equal(container.tty, false)
    assert.equal(container.oomKilled, false)
    assert.equal(container.error, undefined)
    assert.equal(container.healthCheck, undefined)
  })

  it('never exposes the environment', () => {
    assert.ok(INSPECT_BY_NAME['xo-cap-busy'].Config!.Env!.includes('SECRET_TOKEN=hunter2'))
    assert.doesNotMatch(JSON.stringify(inspected('xo-cap-busy')), /hunter2|SECRET_TOKEN/)
    assert.doesNotMatch(JSON.stringify(listed('xo-cap-busy')), /hunter2|SECRET_TOKEN/)
  })

  it('gives the exit code and dates of an exited container', () => {
    const container = inspected('xo-exited')
    assert.equal(container.exitCode, 3)
    assert.equal(container.startedAt, Date.parse('2026-09-24T16:54:38.102Z'))
    assert.equal(container.finishedAt, Date.parse('2026-09-24T16:54:38.379Z'))
    assert.deepEqual(container.restartPolicy, { name: 'no', maximumRetryCount: 0 })
  })

  it('handles a created container', () => {
    const container = inspected('xo-cap-created')
    assert.equal(container.state, 'created')
    assert.equal(container.exitCode, undefined)
    assert.equal(container.startedAt, undefined)
  })

  it('detects TTY containers', () => {
    assert.equal(inspected('xo-tty').tty, true)
    assert.equal(inspected('xo-nginx').tty, false)
  })

  it('gives the health check status', () => {
    const healthy = inspected('xo-healthy')
    const log = INSPECT_BY_NAME['xo-healthy'].State!.Health!.Log!
    assert.equal(healthy.health, 'healthy')
    assert.deepEqual(healthy.healthCheck, {
      failingStreak: 0,
      lastCheckAt: Date.parse(log.at(-1)!.End!),
      lastExitCode: 0,
    })
    const unhealthy = inspected('xo-unhealthy')
    assert.equal(unhealthy.health, 'unhealthy')
    assert.ok(unhealthy.healthCheck!.failingStreak > 0)
    assert.equal(unhealthy.healthCheck!.lastExitCode, 1)
  })

  it('handles missing optional parts (old API versions)', () => {
    const data = clone(INSPECT_BY_NAME['xo-nginx'])
    delete data.HostConfig!.RestartPolicy
    delete data.NetworkSettings
    delete data.Mounts
    delete data.Config!.Labels
    const container = normalizeContainerInspect(data)
    assert.deepEqual(container.restartPolicy, { name: 'no', maximumRetryCount: 0 })
    assert.deepEqual(container.ports, [])
    assert.deepEqual(container.networks, [])
    assert.deepEqual(container.mounts, [])
    assert.deepEqual(container.labels, {})
  })
})

describe('computeCpuPercent()', () => {
  it('computes the CPU usage of a busy container (one full core)', () => {
    const { cpuPercent, onlineCpus } = computeCpuPercent(STATS_BUSY.cpu_stats, STATS_BUSY.precpu_stats)
    assert.equal(onlineCpus, 6)
    const { cpu_stats: cpu, precpu_stats: precpu } = STATS_BUSY
    assert.equal(
      cpuPercent,
      ((cpu.cpu_usage.total_usage - precpu.cpu_usage.total_usage) / (cpu.system_cpu_usage - precpu.system_cpu_usage)) *
        6 *
        100
    )
    assert.ok(cpuPercent! > 95 && cpuPercent! < 105, String(cpuPercent))
  })

  it('gives 0 for an idle container', () => {
    assert.equal(computeCpuPercent(STATS_NGINX_IDLE.cpu_stats, STATS_NGINX_IDLE.precpu_stats).cpuPercent, 0)
    assert.equal(computeCpuPercent(STATS_PAUSED.cpu_stats, STATS_PAUSED.precpu_stats).cpuPercent, 0)
  })

  it('falls back to percpu_usage when online_cpus is missing', () => {
    const cpu = clone<DockerCpuStats>(STATS_BUSY.cpu_stats)
    const precpu = clone<DockerCpuStats>(STATS_BUSY.precpu_stats)
    delete cpu.online_cpus
    delete precpu.online_cpus
    cpu.cpu_usage!.percpu_usage = [1, 2, 3, 4]
    const { cpuPercent, onlineCpus } = computeCpuPercent(cpu, precpu)
    assert.equal(onlineCpus, 4)
    const expected = (computeCpuPercent(STATS_BUSY.cpu_stats, STATS_BUSY.precpu_stats).cpuPercent! * 4) / 6
    assert.ok(Math.abs(cpuPercent! - expected) < 1e-9, `${cpuPercent} ≠ ${expected}`)

    delete cpu.cpu_usage!.percpu_usage
    assert.deepEqual(computeCpuPercent(cpu, precpu), { cpuPercent: null, onlineCpus: undefined })
  })

  it('gives null, not Infinity, when system_cpu_usage is 0', () => {
    const cpu = clone<DockerCpuStats>(STATS_BUSY.cpu_stats)
    const precpu = clone<DockerCpuStats>(STATS_BUSY.precpu_stats)
    precpu.system_cpu_usage = 0
    assert.equal(computeCpuPercent(cpu, precpu).cpuPercent, null)
    precpu.system_cpu_usage = cpu.system_cpu_usage
    assert.equal(computeCpuPercent(cpu, precpu).cpuPercent, null)
    cpu.system_cpu_usage = 0
    precpu.system_cpu_usage = 0
    assert.equal(computeCpuPercent(cpu, precpu).cpuPercent, null)
  })

  it('gives null for the first object of a stream (no precpu_stats.system_cpu_usage)', () => {
    const [first, second] = STATS_STREAM_NGINX
    assert.equal(first.precpu_stats.system_cpu_usage, undefined)
    assert.equal(computeCpuPercent(first.cpu_stats, first.precpu_stats).cpuPercent, null)
    assert.equal(computeCpuPercent(second.cpu_stats, second.precpu_stats).cpuPercent, 0)
  })

  it('gives null when the counters went backwards', () => {
    const cpu = clone<DockerCpuStats>(STATS_BUSY.cpu_stats)
    cpu.cpu_usage!.total_usage = 0
    assert.equal(computeCpuPercent(cpu, STATS_BUSY.precpu_stats).cpuPercent, null)
  })

  it('gives null without any data', () => {
    assert.equal(computeCpuPercent(STATS_EXITED.cpu_stats, STATS_EXITED.precpu_stats).cpuPercent, null)
    assert.equal(computeCpuPercent(undefined, undefined).cpuPercent, null)
  })
})

describe('computeMemoryUsage()', () => {
  it('subtracts inactive_file on cgroup v2', () => {
    const { usage, stats } = STATS_NGINX_IDLE.memory_stats
    assert.equal(computeMemoryUsage(STATS_NGINX_IDLE.memory_stats), usage - stats.inactive_file)
  })

  // cgroup v1 shape (`docker stats` from a cgroup v1 host, Docker 24)
  const V1 = {
    usage: 104857600,
    max_usage: 209715200,
    limit: 2147483648,
    stats: {
      active_anon: 50331648,
      active_file: 16777216,
      cache: 41943040,
      inactive_anon: 0,
      inactive_file: 25165824,
      rss: 52428800,
      total_active_file: 16777216,
      total_cache: 41943040,
      total_inactive_file: 20971520,
      total_rss: 52428800,
    },
  }

  it('subtracts total_inactive_file on cgroup v1', () => {
    assert.equal(computeMemoryUsage(V1), V1.usage - V1.stats.total_inactive_file)
  })

  it('subtracts cache on cgroup v1 without total_inactive_file', () => {
    const memoryStats = { usage: V1.usage, stats: { cache: V1.stats.cache, rss: V1.stats.rss } }
    assert.equal(computeMemoryUsage(memoryStats), V1.usage - V1.stats.cache)
  })

  it('does not return a negative value', () => {
    assert.equal(computeMemoryUsage({ usage: 1000, stats: { inactive_file: 2000 } }), 1000)
    assert.equal(computeMemoryUsage({ usage: 1000 }), 1000)
  })

  it('gives null without data', () => {
    assert.equal(computeMemoryUsage(STATS_EXITED.memory_stats), null)
    assert.equal(computeMemoryUsage(undefined), null)
  })
})

describe('normalizeContainerStats()', () => {
  it('normalizes the stats of a running container', () => {
    const { memory_stats: memory } = STATS_NGINX_IDLE
    const memoryUsage = memory.usage - memory.stats.inactive_file
    assert.deepEqual(normalizeContainerStats(STATS_NGINX_IDLE), {
      sampledAt: Date.parse(STATS_NGINX_IDLE.read),
      cpuPercent: 0,
      onlineCpus: 6,
      memoryUsage,
      memoryLimit: memory.limit,
      memoryPercent: (memoryUsage / memory.limit) * 100,
      networkRx: STATS_NGINX_IDLE.networks.eth0.rx_bytes,
      networkTx: STATS_NGINX_IDLE.networks.eth0.tx_bytes,
      // no io controller delegated to the rootless daemon
      blockRead: null,
      blockWrite: null,
      pids: 7,
    })
  })

  it('gives nulls for a stopped container', () => {
    assert.deepEqual(normalizeContainerStats(STATS_EXITED), {
      sampledAt: null,
      cpuPercent: null,
      onlineCpus: undefined,
      memoryUsage: null,
      memoryLimit: null,
      memoryPercent: null,
      networkRx: null,
      networkTx: null,
      blockRead: null,
      blockWrite: null,
      pids: null,
    })
  })

  it('never gives NaN or Infinity (which would serialize to null)', () => {
    for (const stats of [STATS_BUSY, STATS_EXITED, STATS_PAUSED, ...STATS_STREAM_NGINX]) {
      const normalized = normalizeContainerStats(stats)
      for (const value of Object.values(normalized)) {
        assert.ok(value === null || value === undefined || Number.isFinite(value))
      }
    }
  })

  it('sums the block I/O (cgroup v1 and v2 op names) and the network interfaces', () => {
    const stats = clone<DockerStatsSample>(STATS_NGINX_IDLE)
    stats.blkio_stats!.io_service_bytes_recursive = [
      { major: 8, minor: 0, op: 'Read', value: 100 },
      { major: 8, minor: 0, op: 'Write', value: 10 },
      { major: 8, minor: 16, op: 'read', value: 200 },
      { major: 8, minor: 16, op: 'write', value: 20 },
      { major: 8, minor: 16, op: 'Total', value: 330 },
    ]
    ;(stats.networks as Record<string, unknown>).eth1 = { rx_bytes: 1, tx_bytes: 2 }
    const { blockRead, blockWrite, networkRx, networkTx } = normalizeContainerStats(stats)
    assert.deepEqual(
      { blockRead, blockWrite, networkRx, networkTx },
      {
        blockRead: 300,
        blockWrite: 30,
        networkRx: STATS_NGINX_IDLE.networks.eth0.rx_bytes + 1,
        networkTx: STATS_NGINX_IDLE.networks.eth0.tx_bytes + 2,
      }
    )
  })

  it('does not compute the CPU usage of Windows containers', () => {
    const stats = { ...clone(STATS_BUSY), os_type: 'windows', memory_stats: { privateworkingset: 1234 } }
    const normalized = normalizeContainerStats(stats)
    assert.equal(normalized.cpuPercent, null)
    assert.equal(normalized.memoryUsage, 1234)
  })

  // a hostile (or buggy) daemon controls every value: only finite numbers may
  // come out, never strings (concatenated by the sums), objects or NaN/Infinity
  describe('hostile values', () => {
    const HOSTILE = ['1000', '', 'x', NaN, Infinity, -Infinity, { valueOf: 1 }, [1], true, null, 1e308]
    const assertOnlyFinite = (normalized: object) => {
      for (const [key, value] of Object.entries(normalized)) {
        assert.ok(
          value === null || value === undefined || (typeof value === 'number' && Number.isFinite(value)),
          `${key}: ${typeof value} ${String(value)}`
        )
      }
    }

    it('in the block I/O and network sums', () => {
      for (const hostile of HOSTILE) {
        const stats = clone<DockerStatsSample>(STATS_NGINX_IDLE)
        stats.blkio_stats!.io_service_bytes_recursive = [
          { op: 'Read', value: 100 },
          { op: 'Read', value: hostile },
          { op: 'Write', value: hostile },
          { op: 'Write', value: 1e308 },
        ]
        stats.networks = { eth0: { rx_bytes: 10, tx_bytes: hostile }, eth1: { rx_bytes: hostile, tx_bytes: 1e308 } }
        const normalized = normalizeContainerStats(stats)
        assertOnlyFinite(normalized)
        if (typeof hostile === 'number' && Number.isFinite(hostile)) {
          continue // 1e308: the sums overflow, checked by assertOnlyFinite
        }
        assert.equal(normalized.blockRead, 100, String(hostile))
        assert.equal(normalized.networkRx, 10, String(hostile))
      }
    })

    it('in the entries themselves (non-object entries, op not a string)', () => {
      const stats = clone<DockerStatsSample>(STATS_NGINX_IDLE)
      stats.blkio_stats!.io_service_bytes_recursive = [null, 'x', 1, { op: 1, value: 1 }, { op: 'read', value: 2 }]
      stats.networks = { eth0: null, eth1: 'x', eth2: { rx_bytes: 3, tx_bytes: 4 } }
      const normalized = normalizeContainerStats(stats)
      assert.equal(normalized.blockRead, 2)
      assert.equal(normalized.networkRx, 3)
      assert.equal(normalized.networkTx, 4)
      stats.networks = 'eth0'
      assertOnlyFinite(normalizeContainerStats(stats))
    })

    it('in privateworkingset (Windows)', () => {
      for (const hostile of HOSTILE) {
        const stats = { os_type: 'windows', memory_stats: { privateworkingset: hostile, limit: 1e-300 } }
        assertOnlyFinite(normalizeContainerStats(stats))
      }
    })

    it('in the CPU and memory counters, online_cpus and pids', () => {
      for (const hostile of HOSTILE) {
        for (const set of [
          (s: DockerStatsSample) => (s.cpu_stats!.online_cpus = hostile),
          (s: DockerStatsSample) => (s.cpu_stats!.cpu_usage!.total_usage = hostile),
          (s: DockerStatsSample) => (s.precpu_stats!.cpu_usage!.total_usage = hostile),
          (s: DockerStatsSample) => (s.cpu_stats!.system_cpu_usage = hostile),
          (s: DockerStatsSample) => (s.precpu_stats!.system_cpu_usage = hostile),
          (s: DockerStatsSample) => (s.cpu_stats!.cpu_usage!.percpu_usage = hostile),
          (s: DockerStatsSample) => (s.memory_stats!.usage = hostile),
          (s: DockerStatsSample) => (s.memory_stats!.limit = hostile),
          (s: DockerStatsSample) => ((s.memory_stats!.stats as Record<string, unknown>).inactive_file = hostile),
          (s: DockerStatsSample) => (s.pids_stats!.current = hostile),
          (s: DockerStatsSample) => (s.read = hostile),
        ]) {
          const stats = clone<DockerStatsSample>(STATS_BUSY)
          set(stats)
          assertOnlyFinite(normalizeContainerStats(stats))
        }
      }
    })

    it('does not accept numeric strings for online_cpus', () => {
      const stats = clone<DockerStatsSample>(STATS_BUSY)
      stats.cpu_stats!.online_cpus = '4'
      delete stats.cpu_stats!.cpu_usage!.percpu_usage
      const normalized = normalizeContainerStats(stats)
      assert.equal(normalized.onlineCpus, undefined)
      assert.equal(normalized.cpuPercent, null)
    })

    it('huge values which overflow give null, not Infinity', () => {
      const stats = clone<DockerStatsSample>(STATS_BUSY)
      stats.cpu_stats!.online_cpus = 1e308
      stats.memory_stats = { usage: 1e308, limit: 1e-300, stats: {} }
      const normalized = normalizeContainerStats(stats)
      assertOnlyFinite(normalized)
      assert.equal(normalized.cpuPercent, null)
      assert.equal(normalized.memoryPercent, null)
    })

    it('a non-object stats value throws (the sampler drops the stream)', () => {
      for (const value of [null, 1, 'x']) {
        assert.throws(() => normalizeContainerStats(value))
      }
    })
  })
})

describe('normalizeEngineInfo()', () => {
  it('normalizes /info and /version', () => {
    assert.deepEqual(normalizeEngineInfo(INFO, VERSION), {
      id: INFO.ID,
      name: 'docker-host',
      engineVersion: '29.8.1',
      apiVersion: '1.56',
      minApiVersion: '1.40',
      operatingSystem: 'Debian GNU/Linux 13 (trixie)',
      osType: 'linux',
      kernelVersion: INFO.KernelVersion,
      architecture: 'x86_64',
      cpus: 6,
      memory: INFO.MemTotal,
      storageDriver: 'overlayfs',
      loggingDriver: 'json-file',
      cgroupDriver: 'systemd',
      cgroupVersion: '2',
      rootless: true,
      containers: { total: 8, running: 5, paused: 1, stopped: 2 },
      images: 3,
      warnings: INFO.Warnings,
    })
  })

  it('works without /version and on a rootful daemon', () => {
    const info = normalizeEngineInfo({ ...INFO, SecurityOptions: ['name=seccomp,profile=builtin'], Warnings: null })
    assert.equal(info.engineVersion, '29.8.1')
    assert.equal(info.apiVersion, undefined)
    assert.equal(info.rootless, false)
    assert.deepEqual(info.warnings, [])
  })
})
