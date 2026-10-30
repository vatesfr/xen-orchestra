import { getTaskRoute } from '@/modules/task/utils/xo-task.util.ts'
import { useV2vReviewStep } from '@/modules/v2v/composables/use-v2v-review-step.composable.ts'
import { useV2vVmLabels } from '@/modules/v2v/composables/use-v2v-vm-labels.composable.ts'
import type { V2vStartVm } from '@/modules/v2v/types/v2v-launch.type.ts'
import { buildV2vStartPayload } from '@/modules/v2v/utils/v2v-start-payload.util.ts'
import { DISKOR_POOL_NAME } from '@/test/create-pool.ts'
import { createV2vConnection } from '@/test/create-v2v-connection.ts'
import { createV2vLaunchSettings, createV2vStartVm } from '@/test/create-v2v-launch.ts'
import { createV2vMigrationList } from '@/test/create-v2v-migration-list.ts'
import { hasRequested } from '@/test/fetch-requests.ts'
import { destinationCollectionsMock } from '@/test/mock-xo-destination-collections.ts'
import { v2vVmRowsCollectionsMock } from '@/test/mock-xo-v2v-vm-rows-collections.ts'
import { vmDeviceCollectionsMock } from '@/test/mock-xo-vm-device-collections.ts'
import { mountComposableOnV2vWizard } from '@/test/mount-on-v2v-wizard.ts'
import { mountV2vReviewStep } from '@/test/mount-v2v-review-step.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'
import { stubFetchResponse } from '@/test/stub-fetch-response.ts'
import { V2V_DEFAULT_SR, V2V_DEFAULT_TEMPLATE, V2V_SSD_SR } from '@/test/v2v-mapping-fixtures.ts'
import { V2V_DB_SYNC_SNAPSHOT, V2V_GONE_VM_ID } from '@/test/v2v-mapping-step-fixtures.ts'
import {
  V2V_CUTOVER_SNAPSHOT,
  V2V_MIGRATED_IMPORT_VM,
  V2V_MIGRATED_VM_POOL,
  V2V_MIGRATED_VM_SR,
  V2V_REVIEW_STEP_LIST,
} from '@/test/v2v-review-step-fixtures.ts'
import { V2V_DB_VM, V2V_LISTED_VM, V2V_WEB_VM } from '@/test/v2v-vms-fixtures.ts'
import { V2V_LIST_POOL } from '@/test/v2v-wizard-fixtures.ts'
import type { XoTask } from '@vates/types'
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
vi.mock(import('@core/composables/modals/use-delete-modal.ts'), () => import('@/test/mock-delete-modal.ts'))

const START_ENDPOINT = `pools/${V2V_LIST_POOL.id}/actions/import_vms_from_vmware`

const NEW_VM = createV2vStartVm({ id: V2V_WEB_VM.id })

const RESUMED_VM = createV2vStartVm({ id: V2V_DB_VM.id, kind: 'resume' })

function mountReviewStep(options?: Parameters<typeof mountV2vReviewStep>[1]) {
  return mountV2vReviewStep(
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
  v2vVmRowsCollectionsMock.reset()
  destinationCollectionsMock.reset()
  vmDeviceCollectionsMock.reset()
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
        reason: result.labels.getCheckInfo({ type: 'not-found', level: 'blocking' }).label,
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

    destinationCollectionsMock.pools.value = [V2V_LIST_POOL]
    destinationCollectionsMock.srs.value = [V2V_DEFAULT_SR, V2V_SSD_SR]

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

it('counts the new VMs and names them with the SRs of their mapping', async () => {
  const { result } = await mountReviewStep()

  expect(result.newVmsCount).toBe(1)
  expect(result.newVmsSummary).toBe(result.labels.getNewVmsSummary([V2V_WEB_VM.name], [V2V_DEFAULT_SR.name_label]))
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
    const list = createV2vMigrationList({ poolId: V2V_LIST_POOL.id, vms: [{ id: V2V_GONE_VM_ID }] })
    const { result } = await mountReviewStep({ list })

    expect(result.launchCount).toBe(0)
    expect(result.canLaunch).toBe(false)
  })

  it('cannot launch without a connected source, nor any VM to show', async () => {
    const { result } = await mountV2vReviewStep(setup =>
      mountComposableOnV2vWizard(() => useV2vReviewStep(), { ...setup, source: undefined })
    )

    expect(result.canLaunch).toBe(false)
    expect(result.vmLaunchOptionsRows).toEqual([])
  })
})

describe('launch', () => {
  it('starts the launchable VMs on the destination pool, then tells their task', async () => {
    stubFetchResponse(202, { taskId: 'task-1' })
    const { result } = await mountReviewStep()

    await launch(result)

    expect(hasRequested('POST', START_ENDPOINT, buildPayload())).toBe(true)
    expect(result.launched).toEqual({ count: 2, taskRoute: getTaskRoute('task-1' as XoTask['id']) })
  })

  it('sends the mapping a new VM overrides on the list, and the overrides of the launch', async () => {
    stubFetchResponse(202, { taskId: 'task-1' })
    const list = createV2vMigrationList({
      ...V2V_REVIEW_STEP_LIST,
      vms: [{ id: V2V_WEB_VM.id, template: V2V_DEFAULT_TEMPLATE.id }, { id: V2V_DB_VM.id }],
    })
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
    stubFetchResponse(202, { taskId: 'task-1' })
    const { result } = await mountReviewStep()

    result.confirmSecondCopy(V2V_LISTED_VM.id, true)
    await launch(result)

    const payload = buildPayload([NEW_VM, RESUMED_VM, createV2vStartVm({ id: V2V_LISTED_VM.id })])

    expect(hasRequested('POST', START_ENDPOINT, payload)).toBe(true)
  })

  it('does not launch while the launch options are invalid', async () => {
    const fetchMock = stubFetchResponse(202, { taskId: 'task-1' })
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
    stubFetchResponse(422, {
      error: 'the migration cannot be started',
      data: {
        errors: [
          { vm: V2V_WEB_VM.id, message: 'RDM disk' },
          { vm: 'vm-unknown', message: 'unknown VM' },
          { message: 'tags are not supported' },
        ],
      },
    })
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
    stubFetchResponse(500, { error: 'unreachable' })
    const { result } = await mountReviewStep()

    await launch(result)

    expect(result.launchError).toEqual({ title: result.t('error'), messages: ['unreachable'] })
  })

  it('forgets the error of the previous launch', async () => {
    silenceConsoleError()
    stubFetchResponse(500, { error: 'unreachable' })
    const { result } = await mountReviewStep()

    await launch(result)
    stubFetchResponse(202, { taskId: 'task-1' })
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
