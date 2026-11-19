import { getTaskRoute } from '@/modules/task/utils/xo-task.util.ts'
import { useV2vLaunch } from '@/modules/v2v/composables/use-v2v-launch.composable.ts'
import { useV2vReviewLabels } from '@/modules/v2v/composables/use-v2v-review-labels.composable.ts'
import type { V2vLaunchableVm } from '@/modules/v2v/types/v2v-launch.type.ts'
import type { V2vMigrationList } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import {
  createV2vStartPayload,
  settleV2vLaunch,
  stubV2vStartAccepted,
  stubV2vStartProblems,
  V2V_START_TASK_ID,
} from '@/test/create-v2v-launch.ts'
import { hasRequested } from '@/test/fetch-requests.ts'
import { xoCollectionsMock, mockXoCollections } from '@/test/mock-xo-collections.ts'
import { mountV2vListStepComposable, type MountV2vListStepOptions } from '@/test/mount-v2v-list-step.ts'
import { resetV2vCollectionMocks } from '@/test/reset-v2v-collection-mocks.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'
import { SERVER_ERROR_MESSAGE, stubFetchServerError } from '@/test/stub-fetch-response.ts'
import { V2V_DEFAULT_TEMPLATE } from '@/test/v2v-mapping-fixtures.ts'
import {
  createV2vReviewStepList,
  V2V_REVIEW_START_ENDPOINT,
  V2V_REVIEW_START_VMS,
} from '@/test/v2v-review-step-fixtures.ts'
import { V2V_DB_VM, V2V_WEB_VM } from '@/test/v2v-vms-fixtures.ts'
import { V2V_LIST_POOL } from '@/test/v2v-wizard-fixtures.ts'
import { flushPromises } from '@vue/test-utils'

mockXoCollections('pool')

const [NEW_VM, RESUMED_VM] = V2V_REVIEW_START_VMS

const LIST = createV2vReviewStepList([{ id: V2V_WEB_VM.id }, { id: V2V_DB_VM.id }])

const VM_NAMES = new Map([V2V_WEB_VM, V2V_DB_VM].map(vm => [vm.id, vm.name]))

// The web VM of the list is new, the DB one resumed: both launchable
function getLaunchableVms({ vms: [webVm, dbVm] }: V2vMigrationList): V2vLaunchableVm[] {
  return [
    { kind: 'new', listVm: webVm, item: { id: webVm.id, name: V2V_WEB_VM.name } },
    { kind: 'resume', listVm: dbVm, item: { id: dbVm.id, name: V2V_DB_VM.name } },
  ]
}

function mountLaunch({
  list = LIST,
  launchableVms = getLaunchableVms(list),
  ...options
}: MountV2vListStepOptions & { launchableVms?: V2vLaunchableVm[] } = {}) {
  return mountV2vListStepComposable(
    'review',
    () => ({
      ...useV2vLaunch(V2V_LIST_POOL.id, { launchableVms, list, getName: id => VM_NAMES.get(id) ?? id }),
      labels: useV2vReviewLabels(),
    }),
    { list, ...options }
  )
}

type Launch = Awaited<ReturnType<typeof mountLaunch>>['result']

beforeEach(() => {
  resetV2vCollectionMocks()
})

describe('vmLaunchOptionsRows', () => {
  it('lists the launchable VMs in list order, on the launch settings', async () => {
    const { result } = await mountLaunch()

    expect(result.vmLaunchOptionsRows).toEqual([
      { id: V2V_WEB_VM.id, name: V2V_WEB_VM.name, overrides: undefined },
      { id: V2V_DB_VM.id, name: V2V_DB_VM.name, overrides: undefined },
    ])
    expect(result.launchCount).toBe(2)
  })

  it('overrides stopping the source of a VM', async () => {
    const { result } = await mountLaunch()

    result.changeVmLaunchOption(V2V_DB_VM.id, 'stopSource', false)

    expect(result.vmLaunchOptionsRows[1].overrides).toEqual({ stopSource: false })
  })

  it('overrides docking the guest and starting a VM, next to its other overrides', async () => {
    const { result } = await mountLaunch()

    result.changeVmLaunchOption(V2V_DB_VM.id, 'stopSource', false)
    result.changeVmLaunchOption(V2V_DB_VM.id, 'docking', true)
    result.changeVmLaunchOption(V2V_DB_VM.id, 'startVm', true)

    expect(result.vmLaunchOptionsRows[1].overrides).toEqual({ stopSource: false, docking: true, startVm: true })
  })

  it('clears the override of a VM set back to the launch settings', async () => {
    const { result } = await mountLaunch()

    result.changeVmLaunchOption(V2V_DB_VM.id, 'stopSource', false)
    result.changeVmLaunchOption(V2V_DB_VM.id, 'stopSource', true)

    expect(result.vmLaunchOptionsRows[1].overrides).toBeUndefined()
  })
})

describe('canLaunch', () => {
  it('can launch the launchable VMs', async () => {
    const { result } = await mountLaunch()

    expect(result.canLaunch).toBe(true)
  })

  it('cannot launch without launchable VM', async () => {
    const { result } = await mountLaunch({ launchableVms: [] })

    expect(result).toMatchObject({ vmLaunchOptionsRows: [], launchCount: 0, canLaunch: false })
  })
})

describe('launch', () => {
  it('starts the launchable VMs on the destination pool, then tells their task', async () => {
    stubV2vStartAccepted()
    const { result } = await mountLaunch()

    await settleV2vLaunch(result.launch)

    expect(hasRequested('POST', V2V_REVIEW_START_ENDPOINT, createV2vStartPayload({ vms: V2V_REVIEW_START_VMS }))).toBe(
      true
    )
    expect(result.launched).toEqual({ count: 2, taskRoute: getTaskRoute(V2V_START_TASK_ID) })
  })

  it('sends the mapping a new VM overrides on the list, and the overrides of the launch', async () => {
    stubV2vStartAccepted()
    const list = createV2vReviewStepList([
      { id: V2V_WEB_VM.id, template: V2V_DEFAULT_TEMPLATE.id },
      { id: V2V_DB_VM.id },
    ])
    const { result } = await mountLaunch({ list })

    result.changeVmLaunchOption(V2V_DB_VM.id, 'stopSource', false)
    await settleV2vLaunch(result.launch)

    const payload = createV2vStartPayload({
      vms: [
        { ...NEW_VM, template: V2V_DEFAULT_TEMPLATE.id },
        { ...RESUMED_VM, overrides: { stopSource: false } },
      ],
    })

    expect(hasRequested('POST', V2V_REVIEW_START_ENDPOINT, payload)).toBe(true)
  })

  it('sends neither the tags nor the MAC choice of the list, which the back end does not support', async () => {
    stubV2vStartAccepted()
    const list = createV2vReviewStepList([
      { id: V2V_WEB_VM.id, tags: ['migrated-from:vmware'], keepMac: false },
      { id: V2V_DB_VM.id },
    ])
    const { result } = await mountLaunch({ list })

    await settleV2vLaunch(result.launch)

    const payload = {
      ...createV2vStartPayload({ vms: V2V_REVIEW_START_VMS }),
      vms: [
        { id: V2V_WEB_VM.id, tags: [], keepMac: true },
        { id: V2V_DB_VM.id, tags: [], keepMac: true },
      ],
    }

    expect(hasRequested('POST', V2V_REVIEW_START_ENDPOINT, payload)).toBe(true)
  })

  it.each([
    { case: 'without a connected source', options: { isSourceConnected: false } },
    {
      case: 'while the destination pool loads',
      prepare: () => {
        xoCollectionsMock.pools.value = []
      },
      errorKey: 'job:arg:pool-id-required',
    },
    {
      case: 'while the launch options are invalid',
      prepare: (result: Launch) => {
        result.form.formData.concurrency = 0
      },
    },
  ])('does not launch $case', async ({ options, prepare, errorKey }) => {
    const fetchMock = stubV2vStartAccepted()
    const { result } = await mountLaunch(options)

    prepare?.(result)
    await settleV2vLaunch(result.launch)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.launched).toBeUndefined()
    expect(result.launchError).toEqual(
      errorKey === undefined ? undefined : { title: result.t('error'), messages: [result.t(errorKey)] }
    )
  })

  it('is launching while the request runs', async () => {
    const { result } = await mountLaunch()

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
    const { result } = await mountLaunch()

    await settleV2vLaunch(result.launch)

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
    const { result } = await mountLaunch()

    await settleV2vLaunch(result.launch)

    expect(result.launchError).toEqual({ title: result.t('error'), messages: [SERVER_ERROR_MESSAGE] })
  })

  it('forgets the error of the previous launch', async () => {
    silenceConsoleError()
    stubFetchServerError()
    const { result } = await mountLaunch()

    await settleV2vLaunch(result.launch)
    stubV2vStartAccepted()
    await settleV2vLaunch(result.launch)

    expect(result.launchError).toBeUndefined()
  })
})
