import { useV2vWizard } from '@/modules/v2v/composables/use-v2v-wizard.composable.ts'
import { UNKNOWN_POOL_ID } from '@/test/create-pool.ts'
import { createV2vMigrationList } from '@/test/create-v2v-migration-list.ts'
import { HOLD_LOADING } from '@/test/hold-loading.ts'
import { xoCollectionsMock, mockXoCollections } from '@/test/mock-xo-collections.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mountOnV2vWizard, type V2vWizardSetup } from '@/test/mount-on-v2v-wizard.ts'
import { seedV2vListPool } from '@/test/seed-v2v-list-pool.ts'
import { V2V_EMPTY_LIST, V2V_LIST_POOL, V2V_LIST_WITH_VMS, V2V_WIZARD_SOURCE } from '@/test/v2v-wizard-fixtures.ts'
import { nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

mockXoCollections('pool')

const UNKNOWN_POOL_LIST = createV2vMigrationList({ poolId: UNKNOWN_POOL_ID })

async function mountWizard(setup: V2vWizardSetup = {}) {
  seedV2vListPool()

  const { mounted: wrapper, router } = await mountOnV2vWizard(
    (router, provide) => mountComposable(() => ({ ...useV2vWizard(), t: useI18n().t }), { router, provide }).wrapper,
    setup
  )

  return { wrapper, wizard: wrapper.vm, router }
}

beforeEach(() => {
  xoCollectionsMock.reset()
})

describe('currentStep', () => {
  it.each<[string, V2vWizardSetup, string]>([
    ['is the source step by default', {}, 'source'],
    ['stays on the source step until connected', { step: 'destination' }, 'source'],
    ['is the requested step once connected', { step: 'destination', source: V2V_WIZARD_SOURCE }, 'destination'],
    [
      'stays on the destination step until a migration list is saved for the pool',
      { step: 'vms', source: V2V_WIZARD_SOURCE, query: { pool: V2V_EMPTY_LIST.poolId } },
      'destination',
    ],
    [
      'is the VMs step once a migration list is saved for the pool',
      { step: 'vms', source: V2V_WIZARD_SOURCE, list: V2V_EMPTY_LIST },
      'vms',
    ],
    [
      'goes back to the destination step once the pools tell its pool is unknown',
      { step: 'vms', source: V2V_WIZARD_SOURCE, list: UNKNOWN_POOL_LIST },
      'destination',
    ],
    [
      'stays on the VMs step until the list holds VMs',
      { step: 'mapping', source: V2V_WIZARD_SOURCE, list: V2V_EMPTY_LIST },
      'vms',
    ],
    [
      'is the mapping step once the list holds VMs',
      { step: 'mapping', source: V2V_WIZARD_SOURCE, list: V2V_LIST_WITH_VMS },
      'mapping',
    ],
  ])('%s', async (_, setup, step) => {
    const { wizard } = await mountWizard(setup)

    expect(wizard.currentStep).toBe(step)
  })

  it('stays on the VMs step while the pools load', async () => {
    const { wizard } = await mountWizard({ step: 'vms', source: V2V_WIZARD_SOURCE, list: V2V_EMPTY_LIST })

    HOLD_LOADING.pools()
    await nextTick()

    expect(wizard.currentStep).toBe('vms')
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

  it.each([
    ['its name', () => {}, V2V_LIST_POOL.name_label],
    ['its id while the pools load', HOLD_LOADING.pools, V2V_LIST_POOL.id],
  ])('names the source and the pool by %s past the destination step', async (_, setPools, destination) => {
    const { wizard } = await mountWizard({ step: 'vms', source: V2V_WIZARD_SOURCE, list: V2V_EMPTY_LIST })

    setPools()
    await nextTick()

    expect(wizard.summary).toBe(
      wizard.t('source-to-destination', { source: V2V_WIZARD_SOURCE.connection.host, destination })
    )
  })
})
