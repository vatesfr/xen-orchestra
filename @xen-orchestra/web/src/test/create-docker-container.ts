import type { FrontXoDockerContainer, FrontXoDockerEngine } from '@/modules/docker/types/docker.type.ts'

/**
 * Builds a fully-populated `FrontXoDockerContainer` for use in tests. Pass
 * `overrides` to tweak only the fields relevant to the case under test.
 */
export function createDockerContainer(overrides: Partial<FrontXoDockerContainer> = {}): FrontXoDockerContainer {
  const dockerId = overrides.dockerId ?? '1b5d79f4a1c9275c5f9e1fc50629ea85ca807fe1c70f03e528e35f4b6ce1963e'

  return {
    id: `engine-123_${dockerId}` as FrontXoDockerContainer['id'],
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
    networks: [{ name: 'bridge', ipAddress: '172.17.0.2' }],
    mounts: [],
    startedAt: 1790276921786,
    healthCheck: undefined,
    restartPolicy: { name: 'no', maximumRetryCount: 0 },
    stats: undefined,
    statsPending: undefined,
    ...overrides,
  }
}

/**
 * Builds a fully-populated `FrontXoDockerEngine` for use in tests.
 */
export function createDockerEngine(overrides: Partial<FrontXoDockerEngine> = {}): FrontXoDockerEngine {
  return {
    id: 'engine-123' as FrontXoDockerEngine['id'],
    host: '192.168.1.100',
    resolvedHost: '192.168.1.100',
    port: 22,
    username: 'docker',
    socketPath: '/var/run/docker.sock',
    hostKeyFingerprint: 'SHA256:G+4RawxzV+6SGkxauQY8Vqmu2KZ4ENCQu/YuxBIARDA',
    ...overrides,
  }
}
