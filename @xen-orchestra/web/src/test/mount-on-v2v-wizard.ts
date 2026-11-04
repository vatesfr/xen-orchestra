import type { V2vMigrationList } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import { createV2vWizardRouter } from '@/test/create-v2v-wizard-router.ts'
import { createConnectedV2vContext, v2vConnectionProvide } from '@/test/v2v-connection-provide.ts'
import { seedV2vMigrationList } from '@/test/v2v-migration-list-storage.ts'
import type { LocationQueryRaw, Router } from 'vue-router'

export type V2vWizardSetup = {
  step?: string
  query?: LocationQueryRaw
  list?: V2vMigrationList
  source?: Parameters<typeof createConnectedV2vContext>[0]
}

// The wizard reads its step and pool from the route, its list from this browser and its source from the connection
// the page provides: without a query, the route holds the pool of the list
export async function mountOnV2vWizard<TMounted>(
  mount: (router: Router, provide: ReturnType<typeof v2vConnectionProvide>) => TMounted,
  { step, list, query = { pool: list?.poolId }, source }: V2vWizardSetup
) {
  if (list !== undefined) {
    seedV2vMigrationList(list)
  }

  const router = await createV2vWizardRouter(step, query)

  const mounted = mount(
    router,
    v2vConnectionProvide(source === undefined ? undefined : createConnectedV2vContext(source))
  )

  return { mounted, router }
}
