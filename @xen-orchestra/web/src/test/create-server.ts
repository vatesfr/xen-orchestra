import type { FrontXoServer } from '@/modules/server/remote-resources/use-xo-server-collection.ts'

/**
 * Builds a fully-populated `FrontXoServer` for use in tests. Pass `overrides` to
 * tweak only the fields relevant to the case under test.
 */
export function createServer(overrides: Partial<FrontXoServer> = {}): FrontXoServer {
  return {
    id: 'server-123',
    label: 'Test Server',
    poolId: 'pool-789',
    poolNameLabel: 'Test Pool',
    poolNameDescription: 'A test pool',
    master: 'host-456',
    host: '192.168.1.1',
    httpProxy: undefined,
    username: 'admin',
    readOnly: false,
    allowUnauthorized: false,
    status: 'connected',
    error: undefined,
    ...overrides,
  } as FrontXoServer
}
