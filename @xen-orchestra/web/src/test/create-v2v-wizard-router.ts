import { createTestRouter } from '@/test/create-test-router.ts'

export async function createV2vWizardRouter(step?: string) {
  const router = createTestRouter()

  await router.push({ name: '/admin/v2v/migrate', query: step === undefined ? {} : { step } })

  return router
}
