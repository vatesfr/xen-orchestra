import { useV2vWizardNavigation } from '@/modules/v2v/composables/use-v2v-wizard-navigation.composable.ts'
import { createV2vWizardRouter, findV2vRouteQuery, V2V_VMS_FILTER_QUERY_KEY } from '@/test/create-v2v-wizard-router.ts'
import { mountComposable } from '@/test/mount-composable.ts'

async function mountNavigation() {
  const router = await createV2vWizardRouter('destination', { pool: 'pool-1', [V2V_VMS_FILTER_QUERY_KEY]: 'name:web' })
  const navigation = mountComposable(() => useV2vWizardNavigation(), { router }).wrapper.vm

  return { navigation, router }
}

describe('goToStep', () => {
  it('goes to the step and keeps the other parameters of the route', async () => {
    const { navigation, router } = await mountNavigation()

    await navigation.goToStep('vms')

    expect(findV2vRouteQuery(router)).toEqual({
      step: 'vms',
      pool: 'pool-1',
      [V2V_VMS_FILTER_QUERY_KEY]: 'name:web',
    })
  })

  it('sets the given parameters along the step', async () => {
    const { navigation, router } = await mountNavigation()

    await navigation.goToStep('vms', { pool: 'pool-2' })

    expect(findV2vRouteQuery(router)).toEqual({
      step: 'vms',
      pool: 'pool-2',
      [V2V_VMS_FILTER_QUERY_KEY]: 'name:web',
    })
  })
})

describe('getStepLocation', () => {
  it('locates the step, keeping the other parameters of the route and setting the given ones', async () => {
    const { navigation, router } = await mountNavigation()

    expect(router.resolve(navigation.getStepLocation('mapping', { vm: 'vm-1' })).query).toEqual({
      step: 'mapping',
      pool: 'pool-1',
      vm: 'vm-1',
      [V2V_VMS_FILTER_QUERY_KEY]: 'name:web',
    })
  })

  it('locates the step without moving to it', async () => {
    const { navigation, router } = await mountNavigation()

    navigation.getStepLocation('vms')

    expect(findV2vRouteQuery(router).step).toBe('destination')
  })
})
