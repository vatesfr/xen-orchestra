import { createTestRouter } from '@/test/create-test-router.ts'
import type { LocationQueryRaw } from 'vue-router'

export async function createV2vWizardRouter(step?: string, query: LocationQueryRaw = {}) {
  const router = createTestRouter()

  await router.push({ name: '/admin/v2v/migrate', query: { step, ...query } })

  return router
}
