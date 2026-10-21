import type { V2vWizardStep } from '@/modules/v2v/utils/v2v-wizard-step.util.ts'
import { type LocationQueryRaw, type RouteLocationRaw, useRoute, useRouter } from 'vue-router'

// The wizard state lives in the route (step, pool, filter): moving to a step keeps the rest of it
export function useV2vWizardNavigation() {
  const router = useRouter()

  const route = useRoute()

  // For a link to the step, `goToStep` moves to it
  function getStepLocation(step: V2vWizardStep, query: LocationQueryRaw = {}): RouteLocationRaw {
    return { query: { ...route.query, ...query, step } }
  }

  function goToStep(step: V2vWizardStep, query: LocationQueryRaw = {}) {
    return router.push(getStepLocation(step, query))
  }

  return { getStepLocation, goToStep }
}
