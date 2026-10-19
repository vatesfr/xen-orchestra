import V2vDestinationStep from '@/modules/v2v/components/destination/V2vDestinationStep.vue'
import V2vSourceStep from '@/modules/v2v/components/source/V2vSourceStep.vue'
import MigrationWizard from '@/modules/v2v/components/wizard/MigrationWizard.vue'
import V2vWizardHeader from '@/modules/v2v/components/wizard/V2vWizardHeader.vue'
import { useV2vConnectionStore } from '@/modules/v2v/stores/v2v-connection.store.ts'
import { connectV2vSource } from '@/test/connect-v2v-source.ts'
import { createV2vConnection } from '@/test/create-v2v-connection.ts'
import { createV2vMigrationList } from '@/test/create-v2v-migration-list.ts'
import { createV2vWizardRouter } from '@/test/create-v2v-wizard-router.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { seedV2vMigrationList } from '@/test/v2v-migration-list-storage.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

beforeEach(() => {
  localStorage.clear()
})

const STORED_LIST = createV2vMigrationList()

async function mountWizard(
  step: string | undefined,
  { isConnected = false, pool }: { isConnected?: boolean; pool?: string } = {}
) {
  const router = await createV2vWizardRouter(step, { pool })

  const wrapper = mount(MigrationWizard, {
    global: createGlobalTestConfig({ router, stubs: { V2vSourceStep: true, V2vDestinationStep: true } }),
  })

  if (isConnected) {
    connectV2vSource({ connection: createV2vConnection({ host: 'vcenter-prod.lab' }) })
    await nextTick()
  }

  return wrapper
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
  expect(wrapper.findComponent(V2vDestinationStep).exists()).toBe(true)
  expect(wrapper.getComponent(V2vWizardHeader).props()).toEqual({
    currentStep: 'destination',
    summary: 'vcenter-prod.lab',
  })
})

it('stays on the destination step until a migration list is saved for the pool', async () => {
  const wrapper = await mountWizard('vms', { isConnected: true, pool: STORED_LIST.poolId })

  expect(wrapper.findComponent(V2vDestinationStep).exists()).toBe(true)
})

it('opens the VMs step once a migration list is saved for the pool', async () => {
  seedV2vMigrationList(STORED_LIST)

  const wrapper = await mountWizard('vms', { isConnected: true, pool: STORED_LIST.poolId })

  expect(wrapper.getComponent(VtsStateHero).text()).toContain(t('coming-soon!'))
})

it('keeps the connection while moving between steps', async () => {
  const wrapper = await mountWizard('destination', { isConnected: true })

  await wrapper.vm.$router.push({ query: { step: 'vms' } })

  expect(useV2vConnectionStore().connection).toBeDefined()
})

it('forgets the connection and its inventory once closed', async () => {
  const wrapper = await mountWizard('destination', { isConnected: true })
  const store = useV2vConnectionStore()

  wrapper.unmount()

  expect(store.connection).toBeUndefined()
  expect(store.inventory).toBeUndefined()
})
