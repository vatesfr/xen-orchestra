import V2vSourceStep from '@/modules/v2v/components/source/V2vSourceStep.vue'
import MigrationWizard from '@/modules/v2v/components/wizard/MigrationWizard.vue'
import V2vWizardHeader from '@/modules/v2v/components/wizard/V2vWizardHeader.vue'
import { createV2vConnectionContext } from '@/modules/v2v/composables/use-v2v-connection.composable.ts'
import { createV2vConnection } from '@/test/create-v2v-connection.ts'
import { createV2vInventory } from '@/test/create-v2v-inventory.ts'
import { createV2vWizardRouter } from '@/test/create-v2v-wizard-router.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { v2vConnectionProvide } from '@/test/v2v-connection-provide.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

async function mountWizard(step: string | undefined, { isConnected = false } = {}) {
  const router = await createV2vWizardRouter(step)

  const context = createV2vConnectionContext()

  if (isConnected) {
    context.setConnection(createV2vConnection({ host: 'vcenter-prod.lab' }), createV2vInventory())
  }

  return mount(MigrationWizard, {
    global: {
      ...createGlobalTestConfig({ router, provide: v2vConnectionProvide(context) }),
      stubs: { V2vSourceStep: true },
    },
  })
}

it('opens the source step by default', async () => {
  const wrapper = await mountWizard(undefined)

  expect(wrapper.findComponent(V2vSourceStep).exists()).toBe(true)
  expect(wrapper.getComponent(V2vWizardHeader).props()).toEqual({
    currentStep: 'source',
    summary: t('v2v:choose-vmware-source'),
  })
})

it('stays on the source step until connected', async () => {
  const wrapper = await mountWizard('destination')

  expect(wrapper.findComponent(V2vSourceStep).exists()).toBe(true)
})

it('opens the requested step once connected, with the source as summary', async () => {
  const wrapper = await mountWizard('destination', { isConnected: true })

  expect(wrapper.findComponent(V2vSourceStep).exists()).toBe(false)
  expect(wrapper.getComponent(VtsStateHero).text()).toContain(t('coming-soon!'))
  expect(wrapper.getComponent(V2vWizardHeader).props()).toEqual({
    currentStep: 'destination',
    summary: 'vcenter-prod.lab',
  })
})

it('keeps the connection while moving between steps', async () => {
  const wrapper = await mountWizard('destination', { isConnected: true })

  await wrapper.vm.$router.push({ query: { step: 'vms' } })
  await nextTick()

  expect(wrapper.findComponent(V2vSourceStep).exists()).toBe(false)
  expect(wrapper.getComponent(V2vWizardHeader).props('summary')).toBe('vcenter-prod.lab')
})
