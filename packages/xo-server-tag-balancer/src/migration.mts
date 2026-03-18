import { createLogger } from '@xen-orchestra/log'
import type { MigrationPlan, XapiClient } from './types.mjs'

const { warn, info } = createLogger('xo:tag-balancer')

const DEFAULT_CONCURRENCY = 2
const ASSERT_TIMEOUT_MS = 30_000
const MIGRATE_TIMEOUT_MS = 600_000

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs)
    promise.then(
      value => {
        clearTimeout(timer)
        resolve(value)
      },
      error => {
        clearTimeout(timer)
        reject(error)
      }
    )
  })
}

async function runWithConcurrency<T>(
  items: [string, string][],
  concurrency: number,
  fn: (vmId: string, hostId: string) => Promise<T | undefined>
): Promise<(T | undefined)[]> {
  const results: (T | undefined)[] = []
  let index = 0

  async function worker(): Promise<void> {
    while (index < items.length) {
      const current = index++
      const item = items[current]
      if (item !== undefined) {
        results[current] = await fn(item[0], item[1])
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  await Promise.allSettled(workers)

  return results
}

export async function executeMigrations(
  migrations: MigrationPlan,
  xapi: XapiClient,
  options?: {
    concurrency?: number
    resolveRef?: (id: string) => string
  }
): Promise<MigrationPlan> {
  const concurrency = options?.concurrency ?? DEFAULT_CONCURRENCY
  const resolveRef = options?.resolveRef
  const entries = Object.entries(migrations)

  if (entries.length === 0) {
    return {}
  }

  info('starting load balance migrations', { count: entries.length, concurrency })

  const executed: MigrationPlan = {}

  await runWithConcurrency(entries, concurrency, async (vmId, hostId) => {
    let vmRef: string
    let hostRef: string

    // Resolve XO IDs to XAPI refs
    try {
      if (resolveRef !== undefined) {
        vmRef = resolveRef(vmId)
        hostRef = resolveRef(hostId)
      } else {
        // fallback: use ID as ref (for testing)
        vmRef = vmId
        hostRef = hostId
      }
    } catch (error) {
      warn('VM or host not found, skipping', { vmId, hostId, error })
      return
    }

    // Step 1: Verify VM is migratable (intra-pool live migration)
    try {
      await withTimeout(
        xapi.call('VM.assert_can_migrate', vmRef, {}, true, {}, {}, {}, {}),
        ASSERT_TIMEOUT_MS,
        'VM.assert_can_migrate'
      )
    } catch (error) {
      warn('VM not migratable, skipping', { vmId, hostId, error })
      return
    }

    // Step 2: Execute pool migrate (no storage motion)
    try {
      await withTimeout(xapi.callAsync('VM.pool_migrate', vmRef, hostRef, {}), MIGRATE_TIMEOUT_MS, 'VM.pool_migrate')
      executed[vmId] = hostId
      info('VM migrated successfully', { vmId, hostId })
    } catch (error) {
      warn('migration failed, skipping', { vmId, hostId, error })
    }
  })

  info('load balance migrations complete', {
    planned: entries.length,
    executed: Object.keys(executed).length,
  })

  return executed
}
