import { DOCKER_STATUS } from '@/modules/docker/types/docker.type.ts'
import {
  buildPublishedPortUrl,
  canDeleteContainer,
  dedupePorts,
  formatPortMapping,
  getContainerActions,
  getDockerStatus,
  getHostKeyErrorData,
  getVmSshCandidateAddresses,
  isSshFingerprint,
  isSshPrivateKey,
  shortContainerId,
  summarizeContainers,
} from '@/modules/docker/utils/xo-docker.util.ts'
import { ApiError } from '@/shared/error/api.error.ts'
import { createDockerContainer, createDockerEngine } from '@/test/create-docker-container.ts'

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

describe('getDockerStatus', () => {
  it('is not-configured without engine', () => {
    expect(getDockerStatus(undefined, undefined)).toBe(DOCKER_STATUS.NOT_CONFIGURED)
  })

  it('is the status of the info of the engine', () => {
    expect(getDockerStatus(createDockerEngine(), { status: 'unreachable' })).toBe(DOCKER_STATUS.UNREACHABLE)
  })

  it('is unknown while the info is loading', () => {
    expect(getDockerStatus(createDockerEngine(), undefined)).toBeUndefined()
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
