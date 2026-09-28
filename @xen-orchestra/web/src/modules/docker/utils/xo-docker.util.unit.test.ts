import {
  buildPublishedPortUrl,
  canDeleteContainer,
  dedupePorts,
  formatDockerLogEntries,
  formatPortMapping,
  getContainerActions,
  getContainerDisplayName,
  getContainerPrimaryAction,
  getContainerStateAccent,
  getHostKeyErrorData,
  getStopConfirmedRestartPolicy,
  getVmSshCandidateAddresses,
  isSshFingerprint,
  isSshPrivateKey,
  getPublishedPortToOpen,
  parseDockerApiError,
  shortContainerId,
  summarizeContainers,
} from '@/modules/docker/utils/xo-docker.util.ts'
import { ApiError } from '@/shared/error/api.error.ts'
import { createDockerContainer } from '@/test/create-docker-container.ts'

describe('getVmSshCandidateAddresses', () => {
  it('keeps the IPv4 addresses, deduplicated, the main one first', () => {
    expect(
      getVmSshCandidateAddresses({
        mainIpAddress: '10.0.0.2',
        addresses: {
          '0/ip': '192.168.1.10',
          '0/ipv4/0': '192.168.1.10',
          '0/ipv6/0': 'fe80::5054:ff:fe12:3401',
          '1/ipv4/0': '10.0.0.2',
        },
      })
    ).toEqual(['10.0.0.2', '192.168.1.10'])
  })

  it('ignores an IPv6 main address', () => {
    expect(getVmSshCandidateAddresses({ mainIpAddress: 'fe80::1', addresses: { '0/ipv4/0': '192.168.1.10' } })).toEqual(
      ['192.168.1.10']
    )
  })

  it('returns nothing when the VM reports no address', () => {
    expect(getVmSshCandidateAddresses({ mainIpAddress: undefined, addresses: {} })).toEqual([])
  })
})

it('shortContainerId keeps the 12 first characters, like docker ps', () => {
  expect(shortContainerId('1b5d79f4a1c9275c5f9e1fc50629ea85ca807fe1c70f03e528e35f4b6ce1963e')).toBe('1b5d79f4a1c9')
})

describe('formatPortMapping', () => {
  it('shows a published TCP port as public→private', () => {
    expect(formatPortMapping({ privatePort: 8096, publicPort: 8080, protocol: 'tcp', ip: '0.0.0.0' })).toBe('8080→8096')
  })

  it('shows the protocol of a published port which is not TCP', () => {
    expect(formatPortMapping({ privatePort: 53, publicPort: 5353, protocol: 'udp' })).toBe('5353→53/udp')
  })

  it('shows an unpublished port with its protocol', () => {
    expect(formatPortMapping({ privatePort: 8096, protocol: 'tcp' })).toBe('8096/tcp')
  })
})

it('dedupePorts drops the IPv6 twin of a port published on all interfaces', () => {
  expect(
    dedupePorts([
      { privatePort: 80, publicPort: 8080, protocol: 'tcp', ip: '0.0.0.0' },
      { privatePort: 80, publicPort: 8080, protocol: 'tcp', ip: '::' },
      { privatePort: 443, protocol: 'tcp' },
    ])
  ).toEqual([
    { privatePort: 80, publicPort: 8080, protocol: 'tcp', ip: '0.0.0.0' },
    { privatePort: 443, protocol: 'tcp' },
  ])
})

describe('buildPublishedPortUrl', () => {
  it('opens a published TCP port on the address of the VM', () => {
    expect(
      buildPublishedPortUrl({ privatePort: 80, publicPort: 8080, protocol: 'tcp', ip: '0.0.0.0' }, '10.0.0.2')
    ).toBe('http://10.0.0.2:8080')
  })

  it('brackets an IPv6 host', () => {
    expect(buildPublishedPortUrl({ privatePort: 80, publicPort: 8080, protocol: 'tcp' }, 'fd00::2')).toBe(
      'http://[fd00::2]:8080'
    )
  })

  it.each([
    ['unpublished', { privatePort: 80, protocol: 'tcp' }],
    ['bound to the loopback', { privatePort: 80, publicPort: 9090, protocol: 'tcp', ip: '127.0.0.1' }],
    ['bound to the IPv6 loopback', { privatePort: 80, publicPort: 9090, protocol: 'tcp', ip: '::1' }],
    ['UDP', { privatePort: 53, publicPort: 5353, protocol: 'udp' }],
  ])('returns undefined for a port %s', (_, port) => {
    expect(buildPublishedPortUrl(port, '10.0.0.2')).toBeUndefined()
  })

  it('returns undefined without host', () => {
    expect(buildPublishedPortUrl({ privatePort: 80, publicPort: 8080, protocol: 'tcp' }, undefined)).toBeUndefined()
  })
})

describe('getContainerActions', () => {
  it.each([
    ['running', ['restart', 'pause', 'stop'], false],
    ['paused', ['unpause', 'stop'], false],
    ['restarting', ['stop'], false],
    ['created', ['start'], true],
    ['exited', ['start'], true],
    ['dead', ['start'], true],
    ['removing', [], false],
  ] as const)('offers the right actions for a %s container', (state, actions, deletable) => {
    expect(getContainerActions(state)).toEqual(actions)
    expect(canDeleteContainer(state)).toBe(deletable)
  })
})

describe('summarizeContainers', () => {
  it('counts the containers by state and groups the Compose projects', () => {
    const summary = summarizeContainers([
      createDockerContainer({ state: 'running', compose: { project: 'demo', service: 'web' } }),
      createDockerContainer({ state: 'exited', exitCode: 0, compose: { project: 'demo', service: 'cache' } }),
      createDockerContainer({ state: 'paused' }),
      createDockerContainer({ state: 'created' }),
      createDockerContainer({ state: 'running', compose: { project: 'app' } }),
    ])

    expect(summary).toEqual({
      total: 5,
      running: 2,
      paused: 1,
      stopped: 2,
      composeProjects: [
        { name: 'app', containers: 1, running: 1 },
        { name: 'demo', containers: 2, running: 1 },
      ],
    })
  })

  it('is empty without container', () => {
    expect(summarizeContainers([])).toEqual({ total: 0, running: 0, paused: 0, stopped: 0, composeProjects: [] })
  })
})

describe('getHostKeyErrorData', () => {
  const conflict = (data: Record<string, unknown>) =>
    new ApiError('Conflict', { status: 409, cause: { error: 'the SSH host key is unknown', data } })

  it('extracts the fingerprint of an unknown host key', () => {
    expect(
      getHostKeyErrorData(conflict({ code: 'HOST_KEY_UNKNOWN', fingerprint: 'SHA256:abc', algorithm: 'ssh-ed25519' }))
    ).toEqual({ code: 'HOST_KEY_UNKNOWN', fingerprint: 'SHA256:abc', algorithm: 'ssh-ed25519' })
  })

  it('extracts both fingerprints of a mismatching host key', () => {
    expect(
      getHostKeyErrorData(conflict({ code: 'HOST_KEY_MISMATCH', expected: 'SHA256:old', actual: 'SHA256:new' }))
    ).toMatchObject({ code: 'HOST_KEY_MISMATCH', expected: 'SHA256:old', actual: 'SHA256:new' })
  })

  it('ignores the other errors', () => {
    expect(getHostKeyErrorData(conflict({ objectId: 'engine-1', objectType: 'docker-engine' }))).toBeUndefined()
    expect(getHostKeyErrorData(conflict({ code: 'HOST_KEY_MISMATCH', actual: 'SHA256:new' }))).toBeUndefined()
    expect(
      getHostKeyErrorData(new ApiError('Bad Gateway', { status: 502, cause: { data: { code: 'SSH_AUTH_FAILED' } } }))
    ).toBeUndefined()
    expect(getHostKeyErrorData(new Error('network'))).toBeUndefined()
  })
})

it('isSshFingerprint accepts the format printed by ssh-keygen -l', () => {
  expect(isSshFingerprint('SHA256:G+4RawxzV+6SGkxauQY8Vqmu2KZ4ENCQu/YuxBIARDA')).toBe(true)
  expect(isSshFingerprint('MD5:12:34')).toBe(false)
  expect(isSshFingerprint('SHA256:short')).toBe(false)
})

it('isSshPrivateKey accepts PEM and OpenSSH keys', () => {
  expect(isSshPrivateKey('\n-----BEGIN OPENSSH PRIVATE KEY-----\n…')).toBe(true)
  expect(isSshPrivateKey('ssh-ed25519 AAAAC3Nza… user@host')).toBe(false)
})

describe('getContainerPrimaryAction', () => {
  it.each([
    ['running', 'stop'],
    ['restarting', 'stop'],
    ['paused', 'unpause'],
    ['created', 'start'],
    ['exited', 'start'],
    ['dead', 'start'],
    ['removing', undefined],
  ] as const)('is %s → %s, one of the actions of the state', (state, action) => {
    expect(getContainerPrimaryAction(state)).toBe(action)

    if (action !== undefined) {
      expect(getContainerActions(state)).toContain(action)
    }
  })
})

it.each([
  ['always', 'always'],
  ['unless-stopped', 'unless-stopped'],
  ['on-failure', undefined],
  ['no', undefined],
])('getStopConfirmedRestartPolicy with the restart policy %s is %s', (name, expected) => {
  expect(getStopConfirmedRestartPolicy({ restartPolicy: { name, maximumRetryCount: 0 } })).toBe(expected)
})

it('getStopConfirmedRestartPolicy does not confirm without restart policy', () => {
  expect(getStopConfirmedRestartPolicy({ restartPolicy: undefined })).toBeUndefined()
})

describe('getContainerStateAccent', () => {
  it.each([
    ['running', undefined, 'success'],
    ['running', 'healthy', 'success'],
    ['running', 'unhealthy', 'warning'],
    ['paused', undefined, 'warning'],
    ['restarting', undefined, 'warning'],
    ['exited', undefined, 'danger'],
    ['dead', undefined, 'danger'],
    ['created', undefined, 'muted'],
    ['removing', undefined, 'muted'],
  ] as const)('a %s container (health: %s) is %s', (state, health, accent) => {
    expect(getContainerStateAccent({ state, health })).toBe(accent)
  })
})

it('getContainerDisplayName falls back on the short id', () => {
  expect(getContainerDisplayName({ name: 'web', dockerId: 'e5b2628a2b8a0a1f7f27' })).toBe('web')
  expect(getContainerDisplayName({ name: undefined, dockerId: 'e5b2628a2b8a0a1f7f27' })).toBe('e5b2628a2b8a')
})

describe('getPublishedPortToOpen', () => {
  it('offers the only published TCP port, published twice by Docker (IPv4 and IPv6)', () => {
    expect(
      getPublishedPortToOpen(
        [
          { ip: '0.0.0.0', privatePort: 80, publicPort: 8080, protocol: 'tcp' },
          { ip: '::', privatePort: 80, publicPort: 8080, protocol: 'tcp' },
          { privatePort: 443, protocol: 'tcp' },
          { ip: '0.0.0.0', privatePort: 53, publicPort: 5353, protocol: 'udp' },
        ],
        '10.0.0.5'
      )
    ).toEqual({
      port: { ip: '0.0.0.0', privatePort: 80, publicPort: 8080, protocol: 'tcp' },
      url: 'http://10.0.0.5:8080',
    })
  })

  it('offers nothing with several published TCP ports', () => {
    expect(
      getPublishedPortToOpen(
        [
          { ip: '0.0.0.0', privatePort: 80, publicPort: 8080, protocol: 'tcp' },
          { ip: '0.0.0.0', privatePort: 443, publicPort: 8443, protocol: 'tcp' },
        ],
        '10.0.0.5'
      )
    ).toBeUndefined()
  })

  it('offers nothing for a port bound to the loopback interface of the guest', () => {
    expect(
      getPublishedPortToOpen([{ ip: '127.0.0.1', privatePort: 80, publicPort: 9090, protocol: 'tcp' }], '10.0.0.5')
    ).toBeUndefined()
  })

  it('offers nothing without published port or without address', () => {
    expect(getPublishedPortToOpen([{ privatePort: 80, protocol: 'tcp' }], '10.0.0.5')).toBeUndefined()
    expect(
      getPublishedPortToOpen([{ ip: '0.0.0.0', privatePort: 80, publicPort: 8080, protocol: 'tcp' }], undefined)
    ).toBeUndefined()
  })
})

describe('parseDockerApiError', () => {
  it('reads the cooldown of a 429 SSH_COOLDOWN', () => {
    const error = new ApiError('Too Many Requests', {
      status: 429,
      cause: { error: 'a recent attempt failed', data: { code: 'SSH_COOLDOWN', retryAfter: 7.2 } },
    })

    expect(parseDockerApiError(error)).toEqual({
      status: 429,
      code: 'SSH_COOLDOWN',
      message: 'a recent attempt failed',
      retryAfter: 8,
    })
  })

  it('reads the message of a Docker error passed through', () => {
    const error = new ApiError('Conflict', {
      status: 409,
      cause: { error: 'container is already paused', data: { code: 'DOCKER_API_ERROR', statusCode: 409 } },
    })

    expect(parseDockerApiError(error)).toEqual({
      status: 409,
      code: 'DOCKER_API_ERROR',
      message: 'container is already paused',
      retryAfter: undefined,
    })
  })

  it('falls back on the message of other errors', () => {
    expect(parseDockerApiError(new Error('Failed to fetch')).message).toBe('Failed to fetch')
  })
})

it('formatDockerLogEntries prints one line per entry, marking the error stream', () => {
  expect(
    formatDockerLogEntries([
      { timestamp: '2026-09-25T08:42:01.123456789Z', stream: 'stdout', message: 'ready' },
      { timestamp: '2026-09-25T08:42:02.000000000Z', stream: 'stderr', message: 'oops' },
      { stream: 'stdout', message: 'no timestamp' },
    ])
  ).toBe('2026-09-25 08:42:01 ready\n2026-09-25 08:42:02 [stderr] oops\nno timestamp')
})
