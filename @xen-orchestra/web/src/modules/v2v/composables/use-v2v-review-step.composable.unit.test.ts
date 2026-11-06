import { getTaskRoute } from '@/modules/task/utils/xo-task.util.ts'
import { useV2vReviewStep } from '@/modules/v2v/composables/use-v2v-review-step.composable.ts'
import { useV2vVmLabels } from '@/modules/v2v/composables/use-v2v-vm-labels.composable.ts'
import type { V2vStartVm } from '@/modules/v2v/types/v2v-launch.type.ts'
import { buildV2vStartPayload } from '@/modules/v2v/utils/v2v-start-payload.util.ts'
import { DISKOR_POOL_NAME } from '@/test/create-pool.ts'
import { createV2vConnection } from '@/test/create-v2v-connection.ts'
import {
  createV2vLaunchSettings,
  createV2vStartVm,
  stubV2vStartAccepted,
  stubV2vStartProblems,
  V2V_START_TASK_ID,
} from '@/test/create-v2v-launch.ts'
import { hasRequested } from '@/test/fetch-requests.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { v2vVmRowsCollectionsMock } from '@/test/mock-xo-v2v-vm-rows-collections.ts'
import { mountComposableOnV2vWizard } from '@/test/mount-on-v2v-wizard.ts'
import { mountV2vListStep } from '@/test/mount-v2v-list-step.ts'
import { resetV2vCollectionMocks } from '@/test/reset-v2v-collection-mocks.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'
import { SERVER_ERROR_MESSAGE, stubFetchServerError } from '@/test/stub-fetch-response.ts'
import { V2V_DEFAULT_SR, V2V_DEFAULT_TEMPLATE, V2V_SSD_SR } from '@/test/v2v-mapping-fixtures.ts'
import { V2V_DB_SYNC_SNAPSHOT, V2V_GONE_VM_ID, V2V_MAPPING_STEP_INVENTORY } from '@/test/v2v-mapping-step-fixtures.ts'
import {
  createV2vReviewStepList,
  V2V_CUTOVER_SNAPSHOT,
  V2V_MIGRATED_IMPORT_VM,
  V2V_MIGRATED_VM_POOL,
  V2V_MIGRATED_VM_SR,
  V2V_REVIEW_STEP_EXCLUDED_LIST,
  V2V_REVIEW_STEP_LIST,
} from '@/test/v2v-review-step-fixtures.ts'
import { V2V_SELECTED_VM_CHECK } from '@/test/v2v-selected-vm-checks.ts'
import { V2V_DB_VM, V2V_LISTED_VM, V2V_WEB_VM } from '@/test/v2v-vms-fixtures.ts'
import { V2V_LIST_POOL } from '@/test/v2v-wizard-fixtures.ts'
import type { XoV2vDisk } from '@vates/types'
import { flushPromises } from '@vue/test-utils'

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
  () => import('@/test/mock-xo-collections.ts')
)
vi.mock(
  import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)
vi.mock(
  import('@/modules/network/remote-resources/use-xo-network-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)
vi.mock(
  import('@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
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

const START_ENDPOINT = `pools/${V2V_LIST_POOL.id}/actions/import_vms_from_vmware`

const NEW_VM = createV2vStartVm({ id: V2V_WEB_VM.id })

const RESUMED_VM = createV2vStartVm({ id: V2V_DB_VM.id, kind: 'resume' })

// The disks of the factory all share one key and chain: the DB VM gets two distinct ones, only the first held by its
// import
const DB_VM_DISTINCT_DISKS_INVENTORY = (() => {
  const [systemDisk, dataDisk] = V2V_DB_VM.disks
  const dbVm = {
    ...V2V_DB_VM,
    disks: [systemDisk, { ...dataDisk, key: 'scsi0:1' as XoV2vDisk['key'], chainPaths: ['db-01/db-01_1.vmdk'] }],
  }

  return {
    ...V2V_MAPPING_STEP_INVENTORY,
    vms: V2V_MAPPING_STEP_INVENTORY.vms.map(vm => (vm.id === dbVm.id ? dbVm : vm)),
  }
})()

function mountReviewStep(options?: Parameters<typeof mountV2vListStep>[2]) {
  return mountV2vListStep(
    'review',
    setup => mountComposableOnV2vWizard(() => ({ ...useV2vReviewStep(), labels: useV2vVmLabels() }), setup),
    options
  )
}

type ReviewStep = Awaited<ReturnType<typeof mountReviewStep>>['result']

// The launch of the new and the resumed VMs of the list, on the settings a launch starts with
function buildPayload(vms: V2vStartVm[] = [NEW_VM, RESUMED_VM]) {
  return buildV2vStartPayload({
    connection: createV2vConnection(),
    defaults: V2V_REVIEW_STEP_LIST.defaults,
    settings: createV2vLaunchSettings(),
    vms,
  })
}

async function launch(result: ReviewStep) {
  await result.launch()
  await flushPromises()
}

beforeEach(() => {
  resetV2vCollectionMocks()
})

describe('isBusy', () => {
  it('is not busy once the rows and the choices of the pool are ready', async () => {
    const { result } = await mountReviewStep()

    expect(result.isBusy).toBe(false)
  })

  it('is busy while the rows load', async () => {
    const { result } = await mountReviewStep()

    v2vVmRowsCollectionsMock.areVmsReady.value = false

    expect(result.isBusy).toBe(true)
  })
})

describe('summaryParts', () => {
  it('names the destination pool, counts the VMs of the list, the excluded ones and those to confirm', async () => {
    const { result } = await mountReviewStep()

    expect(result.summaryParts).toEqual(
      result.labels.getReviewSummaryParts(DISKOR_POOL_NAME, 4, { excluded: 1, unconfirmed: 1 })
    )
  })

  it('no longer counts an already migrated VM once confirmed', async () => {
    const { result } = await mountReviewStep()

    result.confirmSecondCopy(V2V_LISTED_VM.id, true)

    expect(result.summaryParts).toEqual(
      result.labels.getReviewSummaryParts(DISKOR_POOL_NAME, 4, { excluded: 1, unconfirmed: 0 })
    )
  })
})

it('heads each group with its label and accent', async () => {
  const { result } = await mountReviewStep()

  expect(result.groupHeadings).toEqual({
    excluded: result.labels.getLaunchGroupHeading('excluded'),
    migrated: result.labels.getLaunchGroupHeading('migrated'),
    resumed: result.labels.getLaunchGroupHeading('resumed'),
    new: result.labels.getLaunchGroupHeading('new'),
  })
})

describe('excludedVms', () => {
  it('excludes a blocked VM with the reason the panel gives, linking to its mapping', async () => {
    const { result } = await mountReviewStep()

    expect(result.excludedVms).toEqual([
      {
        id: V2V_GONE_VM_ID,
        name: V2V_GONE_VM_ID,
        route: { query: { pool: V2V_LIST_POOL.id, step: 'mapping', vm: V2V_GONE_VM_ID } },
        reason: result.labels.getCheckInfo(V2V_SELECTED_VM_CHECK.notFound).label,
      },
    ])
  })
})

describe('migratedVms', () => {
  it('tells the existing VM, its pool, its SRs and its cutover date, unconfirmed', async () => {
    const { result } = await mountReviewStep()

    expect(result.migratedVms).toEqual([
      {
        id: V2V_LISTED_VM.id,
        name: V2V_LISTED_VM.name,
        importVm: { id: V2V_MIGRATED_IMPORT_VM.id, name: V2V_MIGRATED_IMPORT_VM.name_label },
        poolName: V2V_MIGRATED_VM_POOL.name_label,
        srs: V2V_MIGRATED_VM_SR.name_label,
        cutover: result.labels.getCutoverLabel(V2V_CUTOVER_SNAPSHOT.snapshot_time * 1000),
        isConfirmed: false,
      },
    ])
  })

  it('tells no cutover date once its snapshot is gone', async () => {
    const { result } = await mountReviewStep()

    v2vVmRowsCollectionsMock.snapshots.value = [V2V_DB_SYNC_SNAPSHOT]

    expect(result.migratedVms[0].cutover).toBeUndefined()
  })

  it('names a pool and an SR still loading by their ids', async () => {
    const { result } = await mountReviewStep()

    xoCollectionsMock.pools.value = [V2V_LIST_POOL]
    xoCollectionsMock.srs.value = [V2V_DEFAULT_SR, V2V_SSD_SR]

    expect(result.migratedVms[0]).toMatchObject({ poolName: V2V_MIGRATED_VM_POOL.id, srs: V2V_MIGRATED_VM_SR.id })
  })

  it('is confirmed once the user asks for a second copy, and unconfirmed again', async () => {
    const { result } = await mountReviewStep()

    result.confirmSecondCopy(V2V_LISTED_VM.id, true)

    expect(result.migratedVms[0].isConfirmed).toBe(true)

    result.confirmSecondCopy(V2V_LISTED_VM.id, false)

    expect(result.migratedVms[0].isConfirmed).toBe(false)
  })
})

it('resumes a warm VM on the pool and the SRs of its import, with its next transfer', async () => {
  const { result } = await mountReviewStep()

  expect(result.resumedVms).toEqual([
    {
      id: V2V_DB_VM.id,
      name: V2V_DB_VM.name,
      parts: result.labels.getResumedVmParts('full', DISKOR_POOL_NAME, [V2V_SSD_SR.name_label]),
    },
  ])
})

it('leaves out of the SRs of a resumed VM a disk its import does not hold yet', async () => {
  const { result } = await mountReviewStep({ inventory: DB_VM_DISTINCT_DISKS_INVENTORY })

  expect(result.resumedVms[0].parts).toEqual(
    result.labels.getResumedVmParts('full', DISKOR_POOL_NAME, [V2V_SSD_SR.name_label])
  )
})

it('counts the new VMs and names them with the SRs of their mapping', async () => {
  const { result } = await mountReviewStep()

  expect(result.newVmsCount).toBe(1)
  expect(result.newVmsSummary).toBe(result.labels.getNewVmsSummary([V2V_WEB_VM.name], [V2V_DEFAULT_SR.name_label]))
})

it('names once an SR several new VMs are mapped to', async () => {
  const { result } = await mountReviewStep({
    list: createV2vReviewStepList([{ id: V2V_WEB_VM.id }, { id: V2V_DB_VM.id }]),
    inventory: DB_VM_DISTINCT_DISKS_INVENTORY,
  })

  // Without its import, the DB VM is new too
  v2vVmRowsCollectionsMock.vms.value = []

  expect(result.newVmsCount).toBe(2)
  expect(result.newVmsSummary).toBe(
    result.labels.getNewVmsSummary([V2V_WEB_VM.name, V2V_DB_VM.name], [V2V_DEFAULT_SR.name_label])
  )
})

it('has nothing to review nor to launch on an empty list', async () => {
  const { result } = await mountReviewStep({ list: createV2vReviewStepList([]) })

  expect(result).toMatchObject({
    summaryParts: result.labels.getReviewSummaryParts(DISKOR_POOL_NAME, 0, { excluded: 0, unconfirmed: 0 }),
    excludedVms: [],
    migratedVms: [],
    resumedVms: [],
    newVmsCount: 0,
    vmLaunchOptionsRows: [],
    launchCount: 0,
    canLaunch: false,
  })
})

describe('vmLaunchOptionsRows', () => {
  it('lists the launchable VMs in list order, on the launch settings', async () => {
    const { result } = await mountReviewStep()

    expect(result.vmLaunchOptionsRows).toEqual([
      { id: V2V_WEB_VM.id, name: V2V_WEB_VM.name, overrides: undefined },
      { id: V2V_DB_VM.id, name: V2V_DB_VM.name, overrides: undefined },
    ])
    expect(result.launchCount).toBe(2)
  })

  it('adds an already migrated VM once confirmed', async () => {
    const { result } = await mountReviewStep()

    result.confirmSecondCopy(V2V_LISTED_VM.id, true)

    expect(result.vmLaunchOptionsRows.map(row => row.id)).toEqual([V2V_WEB_VM.id, V2V_DB_VM.id, V2V_LISTED_VM.id])
    expect(result.launchCount).toBe(3)
  })

  it('overrides stopping the source of a VM', async () => {
    const { result } = await mountReviewStep()

    result.changeStopSource(V2V_DB_VM.id, false)

    expect(result.vmLaunchOptionsRows[1].overrides).toEqual({ stopSource: false })
  })

  it('clears the override of a VM set back to the launch settings', async () => {
    const { result } = await mountReviewStep()

    result.changeStopSource(V2V_DB_VM.id, false)
    result.changeStopSource(V2V_DB_VM.id, true)

    expect(result.vmLaunchOptionsRows[1].overrides).toBeUndefined()
  })
})

describe('canLaunch', () => {
  it('can launch the launchable VMs', async () => {
    const { result } = await mountReviewStep()

    expect(result.canLaunch).toBe(true)
  })

  it('cannot launch without launchable VM', async () => {
    const { result } = await mountReviewStep({ list: V2V_REVIEW_STEP_EXCLUDED_LIST })

    expect(result.launchCount).toBe(0)
    expect(result.canLaunch).toBe(false)
  })

  it('cannot launch without a connected source, nor any VM to show', async () => {
    const { result } = await mountReviewStep({ isSourceConnected: false })

    expect(result.canLaunch).toBe(false)
    expect(result.vmLaunchOptionsRows).toEqual([])
  })
})

describe('launch', () => {
  it('starts the launchable VMs on the destination pool, then tells their task', async () => {
    stubV2vStartAccepted()
    const { result } = await mountReviewStep()

    await launch(result)

    expect(hasRequested('POST', START_ENDPOINT, buildPayload())).toBe(true)
    expect(result.launched).toEqual({ count: 2, taskRoute: getTaskRoute(V2V_START_TASK_ID) })
  })

  it('sends the mapping a new VM overrides on the list, and the overrides of the launch', async () => {
    stubV2vStartAccepted()
    const list = createV2vReviewStepList([
      { id: V2V_WEB_VM.id, template: V2V_DEFAULT_TEMPLATE.id },
      { id: V2V_DB_VM.id },
    ])
    const { result } = await mountReviewStep({ list })

    result.changeStopSource(V2V_DB_VM.id, false)
    await launch(result)

    const payload = buildPayload([
      { ...NEW_VM, template: V2V_DEFAULT_TEMPLATE.id },
      { ...RESUMED_VM, overrides: { stopSource: false } },
    ])

    expect(hasRequested('POST', START_ENDPOINT, payload)).toBe(true)
  })

  it('sends a confirmed already migrated VM as a new one', async () => {
    stubV2vStartAccepted()
    const { result } = await mountReviewStep()

    result.confirmSecondCopy(V2V_LISTED_VM.id, true)
    await launch(result)

    const payload = buildPayload([NEW_VM, RESUMED_VM, createV2vStartVm({ id: V2V_LISTED_VM.id })])

    expect(hasRequested('POST', START_ENDPOINT, payload)).toBe(true)
  })

  it('sends neither the tags nor the MAC choice of the list, which the back end does not support', async () => {
    stubV2vStartAccepted()
    const list = createV2vReviewStepList([
      { id: V2V_WEB_VM.id, tags: ['migrated-from:vmware'], keepMac: false },
      { id: V2V_DB_VM.id },
    ])
    const { result } = await mountReviewStep({ list })

    await launch(result)

    const payload = {
      ...buildPayload(),
      vms: [
        { id: V2V_WEB_VM.id, tags: [], keepMac: true },
        { id: V2V_DB_VM.id, tags: [], keepMac: true },
      ],
    }

    expect(hasRequested('POST', START_ENDPOINT, payload)).toBe(true)
  })

  it('does not launch while the destination pool loads', async () => {
    const fetchMock = stubV2vStartAccepted()
    const { result } = await mountReviewStep()

    xoCollectionsMock.pools.value = []
    await launch(result)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.launchError).toEqual({ title: result.t('error'), messages: [result.t('job:arg:pool-id-required')] })
  })

  it('does not launch while the launch options are invalid', async () => {
    const fetchMock = stubV2vStartAccepted()
    const { result } = await mountReviewStep()

    result.form.formData.concurrency = 0
    await launch(result)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.launched).toBeUndefined()
  })

  it('is launching while the request runs', async () => {
    const { result } = await mountReviewStep()

    // The default `fetch` stub never settles: awaiting the launch would hang the test
    void result.launch()
    await flushPromises()

    expect(result.isLaunching).toBe(true)
  })

  it('tells each problem the back end refused the launch for, by VM name', async () => {
    silenceConsoleError()
    stubV2vStartProblems([
      { vm: V2V_WEB_VM.id, message: 'RDM disk' },
      { vm: 'vm-unknown', message: 'unknown VM' },
      { message: 'tags are not supported' },
    ])
    const { result } = await mountReviewStep()

    await launch(result)

    expect(result.launchError).toEqual({
      title: result.t('v2v:launch-problems'),
      messages: [
        result.labels.getStartProblemLabel('RDM disk', V2V_WEB_VM.name),
        result.labels.getStartProblemLabel('unknown VM', 'vm-unknown'),
        'tags are not supported',
      ],
    })
    expect(result.launched).toBeUndefined()
  })

  it('tells any other failure as an error', async () => {
    silenceConsoleError()
    stubFetchServerError()
    const { result } = await mountReviewStep()

    await launch(result)

    expect(result.launchError).toEqual({ title: result.t('error'), messages: [SERVER_ERROR_MESSAGE] })
  })

  it('forgets the error of the previous launch', async () => {
    silenceConsoleError()
    stubFetchServerError()
    const { result } = await mountReviewStep()

    await launch(result)
    stubV2vStartAccepted()
    await launch(result)

    expect(result.launchError).toBeUndefined()
  })
})

describe('navigation', () => {
  it('goes back to the mapping step', async () => {
    const { result, router } = await mountReviewStep()

    await result.back()

    expect(router.currentRoute.value.query.step).toBe('mapping')
  })

  it('goes back to the VMs step', async () => {
    const { result, router } = await mountReviewStep()

    await result.backToVms()

    expect(router.currentRoute.value.query.step).toBe('vms')
  })
})
