import { useV2vWizard } from '@/modules/v2v/composables/use-v2v-wizard.composable.ts'
import { useV2vConnectionStore } from '@/modules/v2v/stores/v2v-connection.store.ts'
import { UNKNOWN_POOL_ID } from '@/test/create-pool.ts'
import { createV2vMigrationList } from '@/test/create-v2v-migration-list.ts'
import { destinationCollectionsMock } from '@/test/mock-xo-destination-collections.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mountOnV2vWizard, type V2vWizardSetup } from '@/test/mount-on-v2v-wizard.ts'
import { V2V_EMPTY_LIST, V2V_LIST_POOL, V2V_LIST_WITH_VMS, V2V_WIZARD_SOURCE } from '@/test/v2v-wizard-fixtures.ts'
import { nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

vi.mock(
  import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'),
  () => import('@/test/mock-xo-destination-collections.ts')
)

const UNKNOWN_POOL_LIST = createV2vMigrationList({ poolId: UNKNOWN_POOL_ID })

async function mountWizard(setup: V2vWizardSetup = {}) {
  destinationCollectionsMock.pools.value = [V2V_LIST_POOL]

  const { mounted: wrapper, router } = await mountOnV2vWizard(
    router => mountComposable(() => ({ ...useV2vWizard(), t: useI18n().t }), { router }).wrapper,
    setup
  )

  return { wrapper, wizard: wrapper.vm, router }
}

beforeEach(() => {
  destinationCollectionsMock.reset()
})

describe('currentStep', () => {
  it('is the source step by default', async () => {
    const { wizard } = await mountWizard()

    expect(wizard.currentStep).toBe('source')
  })

  it('stays on the source step until connected', async () => {
    const { wizard } = await mountWizard({ step: 'destination' })

    expect(wizard.currentStep).toBe('source')
  })

  it('is the requested step once connected', async () => {
    const { wizard } = await mountWizard({ step: 'destination', source: V2V_WIZARD_SOURCE })

    expect(wizard.currentStep).toBe('destination')
  })

  it('stays on the destination step until a migration list is saved for the pool', async () => {
    const { wizard } = await mountWizard({
      step: 'vms',
      source: V2V_WIZARD_SOURCE,
      query: { pool: V2V_EMPTY_LIST.poolId },
    })

    expect(wizard.currentStep).toBe('destination')
  })

  it('is the VMs step once a migration list is saved for the pool', async () => {
    const { wizard } = await mountWizard({ step: 'vms', source: V2V_WIZARD_SOURCE, list: V2V_EMPTY_LIST })

    expect(wizard.currentStep).toBe('vms')
  })

  it('stays on the VMs step while the pools load', async () => {
    const { wizard } = await mountWizard({ step: 'vms', source: V2V_WIZARD_SOURCE, list: V2V_EMPTY_LIST })

    destinationCollectionsMock.pools.value = []
    destinationCollectionsMock.arePoolsReady.value = false
    await nextTick()

    expect(wizard.currentStep).toBe('vms')
  })

  it('goes back to the destination step once the pools tell its pool is unknown', async () => {
    const { wizard } = await mountWizard({ step: 'vms', source: V2V_WIZARD_SOURCE, list: UNKNOWN_POOL_LIST })

    expect(wizard.currentStep).toBe('destination')
  })

  it('stays on the VMs step until the list holds VMs', async () => {
    const { wizard } = await mountWizard({ step: 'mapping', source: V2V_WIZARD_SOURCE, list: V2V_EMPTY_LIST })

    expect(wizard.currentStep).toBe('vms')
  })

  it('is the mapping step once the list holds VMs', async () => {
    const { wizard } = await mountWizard({ step: 'mapping', source: V2V_WIZARD_SOURCE, list: V2V_LIST_WITH_VMS })

    expect(wizard.currentStep).toBe('mapping')
  })
})

describe('summary', () => {
  it('asks for a VMware source on the source step', async () => {
    const { wizard } = await mountWizard()

    expect(wizard.summary).toBe(wizard.t('v2v:choose-vmware-source'))
  })

  it('names the source alone on the destination step, even once its pool is known', async () => {
    const { wizard } = await mountWizard({ step: 'destination', source: V2V_WIZARD_SOURCE, list: V2V_EMPTY_LIST })

    expect(wizard.summary).toBe(V2V_WIZARD_SOURCE.connection.host)
  })

  it('names the source and the pool past the destination step', async () => {
    const { wizard } = await mountWizard({ step: 'vms', source: V2V_WIZARD_SOURCE, list: V2V_EMPTY_LIST })

    expect(wizard.summary).toBe(
      wizard.t('source-to-destination', {
        source: V2V_WIZARD_SOURCE.connection.host,
        destination: V2V_LIST_POOL.name_label,
      })
    )
  })

  it('names the source alone while the pools load', async () => {
    const { wizard } = await mountWizard({ step: 'vms', source: V2V_WIZARD_SOURCE, list: V2V_EMPTY_LIST })

    destinationCollectionsMock.pools.value = []
    destinationCollectionsMock.arePoolsReady.value = false
    await nextTick()

    expect(wizard.summary).toBe(V2V_WIZARD_SOURCE.connection.host)
  })
})

describe('connection', () => {
  it('is kept while moving between steps', async () => {
    const { router } = await mountWizard({ step: 'destination', source: V2V_WIZARD_SOURCE })

    await router.push({ query: { step: 'vms' } })

    expect(useV2vConnectionStore().connection).toEqual(V2V_WIZARD_SOURCE.connection)
  })

  it('is forgotten with its inventory once the wizard is closed', async () => {
    const { wrapper } = await mountWizard({ step: 'destination', source: V2V_WIZARD_SOURCE })
    const store = useV2vConnectionStore()

    wrapper.unmount()

    expect(store.connection).toBeUndefined()
    expect(store.inventory).toBeUndefined()
  })
})
