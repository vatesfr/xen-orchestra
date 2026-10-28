import type { V2vMigrationList } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import { connectV2vSource } from '@/test/connect-v2v-source.ts'
import { createV2vWizardRouter } from '@/test/create-v2v-wizard-router.ts'
import { seedV2vMigrationList } from '@/test/v2v-migration-list-storage.ts'
import { nextTick } from 'vue'
import type { LocationQueryRaw, Router } from 'vue-router'

export type V2vWizardSetup = {
  step?: string
  query?: LocationQueryRaw
  list?: V2vMigrationList
  source?: Parameters<typeof connectV2vSource>[0]
}

// The wizard reads its step and pool from the route, its list from this browser and its source from the connection
// store: without a query, the route holds the pool of the list. The source is connected once mounted, as the store
// needs the Pinia of the mount
export async function mountOnV2vWizard<TMounted>(
  mount: (router: Router) => TMounted,
  { step, list, query = { pool: list?.poolId }, source }: V2vWizardSetup
) {
  if (list !== undefined) {
    seedV2vMigrationList(list)
  }

  const router = await createV2vWizardRouter(step, query)

  const mounted = mount(router)

  if (source !== undefined) {
    connectV2vSource(source)
    await nextTick()
  }

  return { mounted, router }
}
