import V2vDestinationDefaultsCard from '@/modules/v2v/components/destination/V2vDestinationDefaultsCard.vue'
import V2vDestinationPoolCard from '@/modules/v2v/components/destination/V2vDestinationPoolCard.vue'
import V2vDestinationStep from '@/modules/v2v/components/destination/V2vDestinationStep.vue'
import V2vExistingListInfo from '@/modules/v2v/components/destination/V2vExistingListInfo.vue'
import type { useV2vDestinationStep } from '@/modules/v2v/composables/use-v2v-destination-step.composable.ts'
import { createPool } from '@/test/create-pool.ts'
import { getButton } from '@/test/get-button.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

const { destinationStepMock } = await vi.hoisted(async () => {
  const vue = await import('vue')

  return {
    destinationStepMock: {
      form: vue.reactive({
        selectedPool: undefined as ReturnType<typeof createPool> | undefined,
        poolSelectBindings: { label: 'pool' },
        srSelectBindings: { label: 'sr' },
        networkSelectBindings: { label: 'network' },
        templateSelectBindings: { label: 'template' },
      }),
      existingList: vue.ref<ReturnType<typeof useV2vDestinationStep>['existingList']['value']>(),
      submit: vi.fn(),
      back: vi.fn(),
    },
  }
})

vi.mock(import('@/modules/v2v/composables/use-v2v-destination-step.composable.ts'), () => ({
  useV2vDestinationStep: (() => destinationStepMock) as unknown as typeof useV2vDestinationStep,
}))

const POOL = createPool({ name_label: 'diskor' })

function mountStep() {
  return mount(V2vDestinationStep, {
    global: createGlobalTestConfig({
      stubs: { V2vDestinationPoolCard: true, V2vDestinationDefaultsCard: true, V2vExistingListInfo: true },
    }),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  destinationStepMock.form.selectedPool = POOL
  destinationStepMock.existingList.value = undefined
})

it('lets the user choose the pool', () => {
  expect(mountStep().getComponent(V2vDestinationPoolCard).props('poolSelectBindings')).toEqual({ label: 'pool' })
})

it('shows the defaults of the chosen pool', () => {
  expect(mountStep().getComponent(V2vDestinationDefaultsCard).props()).toEqual({
    poolName: 'diskor',
    srSelectBindings: { label: 'sr' },
    networkSelectBindings: { label: 'network' },
    templateSelectBindings: { label: 'template' },
  })
})

it('shows no defaults until a pool is chosen', () => {
  destinationStepMock.form.selectedPool = undefined

  expect(mountStep().findComponent(V2vDestinationDefaultsCard).exists()).toBe(false)
})

it('says a list holding VMs exists and continues with it', () => {
  const existingList = { sourceHost: 'vcenter-prod.lab', poolName: 'diskor', vmCount: 4 }
  destinationStepMock.existingList.value = existingList
  const wrapper = mountStep()

  expect(wrapper.getComponent(V2vExistingListInfo).props()).toEqual(existingList)
  expect(getButton(wrapper, t('action:continue-with-existing-list')).exists()).toBe(true)
})

it('continues without mentioning a list when none holds VMs', () => {
  const wrapper = mountStep()

  expect(wrapper.findComponent(V2vExistingListInfo).exists()).toBe(false)
  expect(getButton(wrapper, t('action:continue')).exists()).toBe(true)
})

it('submits the destination', async () => {
  await mountStep().get('form').trigger('submit')

  expect(destinationStepMock.submit).toHaveBeenCalledOnce()
})

it('goes back to the source step', async () => {
  await getButton(mountStep(), t('action:back')).trigger('click')

  expect(destinationStepMock.back).toHaveBeenCalledOnce()
})
