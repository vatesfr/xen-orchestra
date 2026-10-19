import type { V2vRememberedConnection } from '@/modules/v2v/types/v2v-remembered-connection.type.ts'
import { V2V_TEST_SOURCE } from '@/test/create-v2v-inventory.ts'
import { NOW } from '@/test/now.ts'
import { V2V_PLATFORM, type XoV2vConnection } from '@vates/types'

export function createV2vConnection(overrides: Partial<XoV2vConnection> = {}): XoV2vConnection {
  return {
    host: 'vcenter-prod.lab.local',
    port: 443,
    username: 'migration@vsphere.local',
    password: 'secret',
    skipSslCheck: true,
    ...overrides,
  }
}

export function createV2vRememberedConnection(
  overrides: Partial<V2vRememberedConnection> = {}
): V2vRememberedConnection {
  return {
    ...createV2vConnection(),
    platform: V2V_PLATFORM.VMWARE,
    product: V2V_TEST_SOURCE.product,
    version: V2V_TEST_SOURCE.version,
    sourceId: V2V_TEST_SOURCE.instanceUuid,
    vmCount: 148,
    lastUsedAt: NOW,
    ...overrides,
  }
}

export function createOldAndRecentV2vRememberedConnections() {
  return {
    old: createV2vRememberedConnection({ host: 'old.lab', lastUsedAt: 1 }),
    recent: createV2vRememberedConnection({ host: 'recent.lab', lastUsedAt: 2 }),
  }
}
