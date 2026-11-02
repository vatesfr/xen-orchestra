import type { V2vMigrationList } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import { connectV2vSource } from '@/test/connect-v2v-source.ts'
import { createV2vWizardRouter } from '@/test/create-v2v-wizard-router.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import { seedV2vMigrationList } from '@/test/v2v-migration-list-storage.ts'
import { mount } from '@vue/test-utils'
import { type Component, nextTick } from 'vue'
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

// A composable of a wizard step, run on the route, the list and the source of the setup
export async function mountComposableOnV2vWizard<TResult extends Record<string, unknown>>(
  composable: () => TResult,
  setup: V2vWizardSetup
) {
  const { mounted: result, router } = await mountOnV2vWizard(
    router => mountComposableWithI18n(composable, { router }),
    setup
  )

  return { result, router }
}

type V2vWizardComponentOptions = {
  props?: Record<string, unknown>
  stubs?: NonNullable<Parameters<typeof createGlobalTestConfig>[0]>['stubs']
}

// A component of the wizard, mounted with its props and stubs on the route, the list and the source of the setup
export async function mountComponentOnV2vWizard(
  component: Component,
  { props, stubs }: V2vWizardComponentOptions,
  setup: V2vWizardSetup
) {
  const { mounted: wrapper, router } = await mountOnV2vWizard(
    router => mount(component, { props, global: createGlobalTestConfig({ router, stubs }) }),
    setup
  )

  return { wrapper, router }
}
