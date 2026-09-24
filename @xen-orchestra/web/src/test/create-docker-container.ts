import type { FrontXoDockerContainer, FrontXoDockerEngine } from '@/modules/docker/types/docker.type.ts'

/**
 * Builds a fully-populated `FrontXoDockerContainer` for use in tests. Pass
 * `overrides` to tweak only the fields relevant to the case under test.
 */
export function createDockerContainer(overrides: Partial<FrontXoDockerContainer> = {}): FrontXoDockerContainer {
  const dockerId = overrides.dockerId ?? '1b5d79f4a1c9275c5f9e1fc50629ea85ca807fe1c70f03e528e35f4b6ce1963e'
  const $engine = overrides.$engine ?? ('engine-123' as FrontXoDockerContainer['$engine'])

  return {
    id: `${$engine}_${dockerId}` as FrontXoDockerContainer['id'],
    $engine,
    $VM: 'vm-123' as FrontXoDockerContainer['$VM'],
    dockerId,
    name: 'xo-nginx',
    image: 'nginx:alpine',
    command: "/docker-entrypoint.sh nginx -g 'daemon off;'",
    createdAt: 1790269461978,
    state: 'running',
    status: 'Up 2 hours',
    exitCode: undefined,
    health: undefined,
    ports: [{ privatePort: 80, protocol: 'tcp', publicPort: 8080, ip: '0.0.0.0' }],
    labels: {},
    compose: undefined,
    startedAt: 1790276921786,
    ...overrides,
  }
}

/**
 * Builds a fully-populated `FrontXoDockerEngine` for use in tests.
 */
export function createDockerEngine(overrides: Partial<FrontXoDockerEngine> = {}): FrontXoDockerEngine {
  return {
    id: 'engine-123' as FrontXoDockerEngine['id'],
    $VM: 'vm-123' as FrontXoDockerEngine['$VM'],
    $pool: 'pool-789' as FrontXoDockerEngine['$pool'],
    label: undefined,
    host: '192.168.1.100',
    resolvedHost: '192.168.1.100',
    port: 22,
    username: 'docker',
    socketPath: '/var/run/docker.sock',
    hostKeyFingerprint: 'SHA256:G+4RawxzV+6SGkxauQY8Vqmu2KZ4ENCQu/YuxBIARDA',
    hostKeyAlgorithm: 'ssh-ed25519',
    hasPassword: false,
    hasPrivateKey: true,
    connectionStatus: 'connected',
    error: undefined,
    ...overrides,
  }
}
