import V2vDestinationStep from '@/modules/v2v/components/destination/V2vDestinationStep.vue'
import V2vMappingStep from '@/modules/v2v/components/mapping/V2vMappingStep.vue'
import V2vSourceStep from '@/modules/v2v/components/source/V2vSourceStep.vue'
import V2vVmsStep from '@/modules/v2v/components/vms/V2vVmsStep.vue'
import MigrationWizard from '@/modules/v2v/components/wizard/MigrationWizard.vue'
import V2vWizardHeader from '@/modules/v2v/components/wizard/V2vWizardHeader.vue'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { destinationCollectionsMock } from '@/test/mock-xo-destination-collections.ts'
import { mountOnV2vWizard, type V2vWizardSetup } from '@/test/mount-on-v2v-wizard.ts'
import { V2V_EMPTY_LIST, V2V_LIST_POOL, V2V_LIST_WITH_VMS, V2V_WIZARD_SOURCE } from '@/test/v2v-wizard-fixtures.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { mount } from '@vue/test-utils'

vi.mock(
  import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'),
  () => import('@/test/mock-xo-destination-collections.ts')
)

// Which step shows, and what it is summarized with, belongs to useV2vWizard: here only the composition matters
async function mountWizard(setup: V2vWizardSetup = {}) {
  destinationCollectionsMock.pools.value = [V2V_LIST_POOL]

  const { mounted: wrapper } = await mountOnV2vWizard(
    router =>
      mount(MigrationWizard, {
        global: createGlobalTestConfig({
          router,
          stubs: { V2vSourceStep: true, V2vDestinationStep: true, V2vVmsStep: true, V2vMappingStep: true },
        }),
      }),
    setup
  )

  return wrapper
}

beforeEach(() => {
  destinationCollectionsMock.reset()
})

it('heads the wizard with its current step and summary', async () => {
  const wrapper = await mountWizard({ step: 'vms', source: V2V_WIZARD_SOURCE, list: V2V_EMPTY_LIST })

  expect(wrapper.getComponent(V2vWizardHeader).props()).toEqual({
    currentStep: 'vms',
    summary: t('source-to-destination', {
      source: V2V_WIZARD_SOURCE.connection.host,
      destination: V2V_LIST_POOL.name_label,
    }),
  })
})

it.each([
  ['source', {}, V2vSourceStep],
  ['destination', { step: 'destination', source: V2V_WIZARD_SOURCE }, V2vDestinationStep],
  ['VMs', { step: 'vms', source: V2V_WIZARD_SOURCE, list: V2V_EMPTY_LIST }, V2vVmsStep],
  ['mapping', { step: 'mapping', source: V2V_WIZARD_SOURCE, list: V2V_LIST_WITH_VMS }, V2vMappingStep],
])('shows the %s step alone', async (_, setup: V2vWizardSetup, stepComponent) => {
  const wrapper = await mountWizard(setup)

  const shownSteps = [V2vSourceStep, V2vDestinationStep, V2vVmsStep, V2vMappingStep].filter(step =>
    wrapper.findComponent(step).exists()
  )

  expect(shownSteps).toEqual([stepComponent])
})

// Their side panel sits flush with the page edges: the step lays out its own padding
it.each([
  ['VMs', { step: 'vms', source: V2V_WIZARD_SOURCE, list: V2V_EMPTY_LIST }],
  ['mapping', { step: 'mapping', source: V2V_WIZARD_SOURCE, list: V2V_LIST_WITH_VMS }],
])('lays the %s step out without the padding of the other steps', async (_, setup: V2vWizardSetup) => {
  expect((await mountWizard(setup)).find('.content').exists()).toBe(false)
})

it('tells the review step is coming soon', async () => {
  const wrapper = await mountWizard({ step: 'review', source: V2V_WIZARD_SOURCE, list: V2V_LIST_WITH_VMS })

  expect(wrapper.getComponent(VtsStateHero).text()).toContain(t('coming-soon!'))
})
