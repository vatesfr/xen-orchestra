import { createTestRouter } from '@/test/create-test-router.ts'
import type { LocationQueryRaw } from 'vue-router'

// Where the VMs step keeps its query builder filter
export const V2V_VMS_FILTER_QUERY_KEY = 'qb.v2v-vms'

export async function createV2vWizardRouter(step?: string, query: LocationQueryRaw = {}) {
  const router = createTestRouter()

  await router.push({ name: '/admin/v2v/migrate', query: { step, ...query } })

  return router
}
