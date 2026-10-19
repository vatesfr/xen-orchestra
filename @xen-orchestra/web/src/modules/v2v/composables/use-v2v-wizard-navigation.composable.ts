import type { V2vWizardStep } from '@/modules/v2v/utils/v2v-wizard-step.util.ts'
import { type LocationQueryRaw, useRoute, useRouter } from 'vue-router'

// The wizard state lives in the route (step, pool, filter): moving to a step keeps the rest of it
export function useV2vWizardNavigation() {
  const router = useRouter()

  const route = useRoute()

  function goToStep(step: V2vWizardStep, query: LocationQueryRaw = {}) {
    return router.push({ query: { ...route.query, ...query, step } })
  }

  return { goToStep }
}
