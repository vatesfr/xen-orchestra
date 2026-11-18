import { useV2vReviewLabels } from '@/modules/v2v/composables/use-v2v-review-labels.composable.ts'
import { useV2vReviewStep } from '@/modules/v2v/composables/use-v2v-review-step.composable.ts'
import { DISKOR_POOL_NAME } from '@/test/create-pool.ts'
import {
  createV2vStartPayload,
  createV2vStartVm,
  settleV2vLaunch,
  stubV2vStartAccepted,
} from '@/test/create-v2v-launch.ts'
import { findV2vRouteQuery } from '@/test/create-v2v-wizard-router.ts'
import { hasRequested } from '@/test/fetch-requests.ts'
import { v2vVmRowsCollectionsMock } from '@/test/mock-xo-v2v-vm-rows-collections.ts'
import { mountV2vListStepComposable, type MountV2vListStepOptions } from '@/test/mount-v2v-list-step.ts'
import { resetV2vCollectionMocks } from '@/test/reset-v2v-collection-mocks.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import {
  createV2vReviewStepList,
  V2V_REVIEW_START_ENDPOINT,
  V2V_REVIEW_START_VMS,
} from '@/test/v2v-review-step-fixtures.ts'
import { V2V_LISTED_VM } from '@/test/v2v-vms-fixtures.ts'
import { V2V_LIST_POOL } from '@/test/v2v-wizard-fixtures.ts'

mockModule(
  import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'),
  () => import('@/test/mock-xo-v2v-vm-rows-collections.ts')
)
mockModule(
  import('@/modules/task/remote-resources/use-xo-task-collection.ts'),
  () => import('@/test/mock-xo-v2v-vm-rows-collections.ts')
)
mockModule(
  import('@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-collection.ts'),
  () => import('@/test/mock-xo-v2v-vm-rows-collections.ts')
)
mockModule(
  import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)
mockModule(
  import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)
mockModule(
  import('@/modules/network/remote-resources/use-xo-network-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)
mockModule(
  import('@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)
mockModule(
  import('@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'),
  () => import('@/test/mock-xo-vm-device-collections.ts')
)
mockModule(
  import('@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'),
  () => import('@/test/mock-xo-vm-device-collections.ts')
)
mockModule(
  import('@/modules/vif/remote-resources/use-xo-vif-collection.ts'),
  () => import('@/test/mock-xo-vm-device-collections.ts')
)
mockModule(import('@core/composables/modals/use-delete-modal.ts'), () => import('@/test/mock-delete-modal.ts'))

function mountReviewStep(options?: MountV2vListStepOptions) {
  return mountV2vListStepComposable(
    'review',
    () => ({ ...useV2vReviewStep(V2V_LIST_POOL.id), labels: useV2vReviewLabels() }),
    options
  )
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

  it('counts nothing on an empty list', async () => {
    const { result } = await mountReviewStep({ list: createV2vReviewStepList([]) })

    expect(result.summaryParts).toEqual(
      result.labels.getReviewSummaryParts(DISKOR_POOL_NAME, 0, { excluded: 0, unconfirmed: 0 })
    )
  })
})

describe('launch', () => {
  it('launches a confirmed already migrated VM as a new one, after the launchable VMs of the list', async () => {
    stubV2vStartAccepted()
    const { result } = await mountReviewStep()

    result.confirmSecondCopy(V2V_LISTED_VM.id, true)
    await settleV2vLaunch(result.launch)

    const payload = createV2vStartPayload({
      vms: [...V2V_REVIEW_START_VMS, createV2vStartVm({ id: V2V_LISTED_VM.id })],
    })

    expect(hasRequested('POST', V2V_REVIEW_START_ENDPOINT, payload)).toBe(true)
  })

  it('cannot launch without a connected source, no VM resolving without its inventory', async () => {
    const { result } = await mountReviewStep({ isSourceConnected: false })

    expect(result.canLaunch).toBe(false)
    expect(result.vmLaunchOptionsRows).toEqual([])
  })
})

describe('navigation', () => {
  it('goes back to the mapping step', async () => {
    const { result, router } = await mountReviewStep()

    await result.back()

    expect(findV2vRouteQuery(router).step).toBe('mapping')
  })

  it('goes back to the VMs step', async () => {
    const { result, router } = await mountReviewStep()

    await result.backToVms()

    expect(findV2vRouteQuery(router).step).toBe('vms')
  })
})
