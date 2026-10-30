import { getTaskRoute } from '@/modules/task/utils/xo-task.util.ts'
import V2vLaunchGroup from '@/modules/v2v/components/review/V2vLaunchGroup.vue'
import V2vLaunchGroupVm from '@/modules/v2v/components/review/V2vLaunchGroupVm.vue'
import V2vLaunchOptionsCard from '@/modules/v2v/components/review/V2vLaunchOptionsCard.vue'
import V2vMigratedVmItem from '@/modules/v2v/components/review/V2vMigratedVmItem.vue'
import V2vReviewStep from '@/modules/v2v/components/review/V2vReviewStep.vue'
import V2vVmLaunchOptionsTable from '@/modules/v2v/components/review/V2vVmLaunchOptionsTable.vue'
import { createV2vMigrationList } from '@/test/create-v2v-migration-list.ts'
import { findCardTitleLabel } from '@/test/find-card-title.ts'
import { findParts } from '@/test/find-parts.ts'
import { getButton, getUiButton } from '@/test/get-button.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { destinationCollectionsMock } from '@/test/mock-xo-destination-collections.ts'
import { v2vVmRowsCollectionsMock } from '@/test/mock-xo-v2v-vm-rows-collections.ts'
import { vmDeviceCollectionsMock } from '@/test/mock-xo-vm-device-collections.ts'
import { mountOnV2vWizard } from '@/test/mount-on-v2v-wizard.ts'
import { mountV2vListStep } from '@/test/mount-v2v-list-step.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'
import { stubFetchResponse } from '@/test/stub-fetch-response.ts'
import { V2V_GONE_VM_ID } from '@/test/v2v-mapping-step-fixtures.ts'
import { V2V_DB_VM, V2V_LISTED_VM, V2V_WEB_VM } from '@/test/v2v-vms-fixtures.ts'
import { V2V_LIST_POOL } from '@/test/v2v-wizard-fixtures.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import type { XoTask } from '@vates/types'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'

vi.mock(
  import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'),
  () => import('@/test/mock-xo-v2v-vm-rows-collections.ts')
)
vi.mock(
  import('@/modules/task/remote-resources/use-xo-task-collection.ts'),
  () => import('@/test/mock-xo-v2v-vm-rows-collections.ts')
)
vi.mock(
  import('@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-collection.ts'),
  () => import('@/test/mock-xo-v2v-vm-rows-collections.ts')
)
vi.mock(
  import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'),
  () => import('@/test/mock-xo-destination-collections.ts')
)
vi.mock(
  import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'),
  () => import('@/test/mock-xo-destination-collections.ts')
)
vi.mock(
  import('@/modules/network/remote-resources/use-xo-network-collection.ts'),
  () => import('@/test/mock-xo-destination-collections.ts')
)
vi.mock(
  import('@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'),
  () => import('@/test/mock-xo-destination-collections.ts')
)
vi.mock(
  import('@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'),
  () => import('@/test/mock-xo-vm-device-collections.ts')
)
vi.mock(
  import('@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'),
  () => import('@/test/mock-xo-vm-device-collections.ts')
)
vi.mock(
  import('@/modules/vif/remote-resources/use-xo-vif-collection.ts'),
  () => import('@/test/mock-xo-vm-device-collections.ts')
)
vi.mock(import('@core/composables/modals/use-delete-modal.ts'), () => import('@/test/mock-delete-modal.ts'))

// What each group and line says belongs to useV2vReviewStep and the labels: here only the wiring matters
async function mountStep(options?: Parameters<typeof mountV2vListStep>[2]) {
  const { mounted: wrapper, router } = await mountV2vListStep(
    'review',
    setup =>
      mountOnV2vWizard(
        router =>
          mount(V2vReviewStep, {
            global: createGlobalTestConfig({
              router,
              stubs: { V2vLaunchOptionsCard: true, V2vVmLaunchOptionsTable: true },
            }),
          }),
        setup
      ),
    options
  )

  return { wrapper, router }
}

// A group by its heading
function getGroup(wrapper: VueWrapper, headingKey: string) {
  const group = wrapper.findAllComponents(V2vLaunchGroup).find(found => found.props('heading').label === t(headingKey))

  if (group === undefined) {
    throw new Error(`No group "${headingKey}"`)
  }

  return group
}

const LAUNCH_2_VMS = t('action:launch-n-vms', { n: 2 })

async function launch(wrapper: VueWrapper) {
  await getButton(wrapper, LAUNCH_2_VMS).trigger('click')
  await flushPromises()
}

beforeEach(() => {
  v2vVmRowsCollectionsMock.reset()
  destinationCollectionsMock.reset()
  vmDeviceCollectionsMock.reset()
})

it('shows the step busy while the VMs load', async () => {
  const { wrapper } = await mountStep()

  v2vVmRowsCollectionsMock.areVmsReady.value = false
  await flushPromises()

  expect(wrapper.getComponent(VtsStateHero).props('type')).toBe('busy')
  expect(wrapper.findComponent(V2vLaunchOptionsCard).exists()).toBe(false)
})

it('heads the review with its summary', async () => {
  const { wrapper } = await mountStep()

  expect(findCardTitleLabel(wrapper)).toBe(t('review-and-launch'))
  expect(findParts(wrapper.getComponent(UiCardTitle), '.inline-parts')).toHaveLength(4)
})

it('shows the default options, then the options of each launchable VM', async () => {
  const { wrapper } = await mountStep()

  expect(wrapper.getComponent(V2vLaunchOptionsCard).props('stopSourceCheckboxBindings')).toMatchObject({
    modelValue: true,
  })
  expect(wrapper.getComponent(V2vVmLaunchOptionsTable).props()).toMatchObject({
    rows: [{ id: V2V_WEB_VM.id }, { id: V2V_DB_VM.id }],
    defaultStopSource: true,
  })
})

it('overrides stopping the source of a VM from its row', async () => {
  const { wrapper } = await mountStep()
  const table = wrapper.getComponent(V2vVmLaunchOptionsTable)

  table.vm.$emit('changeStopSource', V2V_DB_VM.id, false)
  await flushPromises()

  expect(table.props('rows')[1].overrides).toEqual({ stopSource: false })
})

it('shows no per-VM options without launchable VM', async () => {
  const list = createV2vMigrationList({ poolId: V2V_LIST_POOL.id, vms: [{ id: V2V_GONE_VM_ID }] })
  const { wrapper } = await mountStep({ list })

  expect(wrapper.findComponent(V2vVmLaunchOptionsTable).exists()).toBe(false)
})

it('links an excluded VM to its mapping, with its reason', async () => {
  const { wrapper } = await mountStep()
  const excluded = getGroup(wrapper, 'v2v:launch-group:excluded').getComponent(V2vLaunchGroupVm)

  expect(excluded.getComponent(UiLink).props('to')).toEqual({
    query: { pool: V2V_LIST_POOL.id, step: 'mapping', vm: V2V_GONE_VM_ID },
  })
  expect(excluded.text()).toBe(`${V2V_GONE_VM_ID}${t('v2v:not-found-in-source')}`)
})

it('names a resumed VM with where it continues', async () => {
  const { wrapper } = await mountStep()

  const resumed = getGroup(wrapper, 'v2v:launch-group:resumed').getComponent(V2vLaunchGroupVm)

  expect(resumed.text()).toMatch(new RegExp(`^${V2V_DB_VM.name}`))
  expect(findParts(resumed, '.inline-parts')).toHaveLength(3)
})

it('names the new VMs', async () => {
  const { wrapper } = await mountStep()

  expect(getGroup(wrapper, 'v2v:launch-group:new').text()).toContain(V2V_WEB_VM.name)
})

it('launches an already migrated VM once its second copy is confirmed', async () => {
  const { wrapper } = await mountStep()
  const item = wrapper.getComponent(V2vMigratedVmItem)

  expect(item.props()).toMatchObject({ vm: { id: V2V_LISTED_VM.id }, destinationPoolName: V2V_LIST_POOL.name_label })

  item.vm.$emit('confirm', true)
  await flushPromises()

  expect(getUiButton(wrapper, t('action:launch-n-vms', { n: 3 })).props('disabled')).toBe(false)
})

it('no longer launches an already migrated VM once its second copy is unconfirmed', async () => {
  const { wrapper } = await mountStep()
  const item = wrapper.getComponent(V2vMigratedVmItem)

  item.vm.$emit('confirm', true)
  item.vm.$emit('confirm', false)
  await flushPromises()

  expect(getUiButton(wrapper, LAUNCH_2_VMS).props('disabled')).toBe(false)
})

it('cannot launch without launchable VM', async () => {
  const list = createV2vMigrationList({ poolId: V2V_LIST_POOL.id, vms: [{ id: V2V_GONE_VM_ID }] })
  const { wrapper } = await mountStep({ list })

  expect(getUiButton(wrapper, t('action:launch-n-vms', { n: 0 })).props('disabled')).toBe(true)
})

it('is busy while the launch runs', async () => {
  const { wrapper } = await mountStep()

  // The default `fetch` stub never settles
  await launch(wrapper)

  expect(getUiButton(wrapper, LAUNCH_2_VMS).props('busy')).toBe(true)
})

it('tells the problems the back end refused the launch for', async () => {
  silenceConsoleError()
  stubFetchResponse(422, { error: 'the migration cannot be started', data: { errors: [{ message: 'tags' }] } })
  const { wrapper } = await mountStep()

  await launch(wrapper)

  const alert = wrapper.getComponent(UiAlert)

  expect(alert.props('accent')).toBe('danger')
  expect(alert.text()).toBe(`${t('v2v:launch-problems')} tags`)
})

it('tells any other failure as an error', async () => {
  silenceConsoleError()
  stubFetchResponse(500, { error: 'unreachable' })
  const { wrapper } = await mountStep()

  await launch(wrapper)

  expect(wrapper.getComponent(UiAlert).text()).toBe(`${t('error')} unreachable`)
})

describe('once launched', () => {
  async function mountLaunched() {
    stubFetchResponse(202, { taskId: 'task-1' })
    const step = await mountStep()

    await launch(step.wrapper)

    return step
  }

  it('tells the VMs are launched', async () => {
    const { wrapper } = await mountLaunched()
    const hero = wrapper.getComponent(VtsStateHero)

    expect(hero.props('type')).toBe('all-good')
    expect(hero.get('.title').text()).toBe(t('v2v:n-vms-launched', { n: 2 }))
    expect(hero.getComponent(UiAlert).text()).toBe(t('v2v:launch-success'))
  })

  it('links to the task of the launch', async () => {
    const link = (await mountLaunched()).wrapper.getComponent(UiLink)

    expect(link.text()).toBe(t('action:see-task'))
    expect(link.props('to')).toEqual(getTaskRoute('task-1' as XoTask['id']))
  })

  it('goes back to the VMs step', async () => {
    const { wrapper, router } = await mountLaunched()

    await getButton(wrapper, t('action:back-to-vms')).trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.query.step).toBe('vms')
  })
})

it('goes back to the mapping step', async () => {
  const { wrapper, router } = await mountStep()

  await getButton(wrapper, t('action:back')).trigger('click')
  await flushPromises()

  expect(router.currentRoute.value.query.step).toBe('mapping')
})
