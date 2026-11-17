import { useNetworkDelete } from '@/modules/network/composables/use-network-delete.composable.ts'
import type { useXoNetworkDeleteJob } from '@/modules/network/jobs/xo-network-delete.job.ts'
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { createJobResult } from '@/test/create-job-result.ts'
import { createNetwork } from '@/test/create-network.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import type { useDeleteModal } from '@core/composables/modals/use-delete-modal.ts'
import type { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { SDN_CONTROLLER_PRIVATE_NETWORK_UUID_KEY } from '@vates/types'

const { run, useDeleteJob, openDeleteModal } = vi.hoisted(() => ({
  run: vi.fn(),
  useDeleteJob: vi.fn(),
  openDeleteModal: vi.fn(),
}))

// The job deletes the networks through the REST API
vi.mock(import('@/modules/network/jobs/xo-network-delete.job.ts'), async importOriginal => ({
  ...(await importOriginal()),
  useXoNetworkDeleteJob: useDeleteJob as unknown as typeof useXoNetworkDeleteJob,
}))

vi.mock(import('@core/composables/modals/use-delete-modal.ts'), () => ({
  useDeleteModal: (() => ({ open: openDeleteModal })) as unknown as typeof useDeleteModal,
}))

// The error modal is the only overlay the composable opens directly
vi.mock(import('@core/packages/overlay/use-overlay.ts'), () => ({
  useOverlay: (() => ({ open: vi.fn() })) as unknown as typeof useOverlay,
}))

beforeEach(() => {
  run.mockReset()
  useDeleteJob.mockReset().mockReturnValue(createJobResult(run))
  openDeleteModal.mockReset()
})

const PIF_ID = 'pif-123' as FrontXoPif['id']

const physicalNetwork = createNetwork({ PIFs: [PIF_ID] })
const bondedNetwork = createNetwork({ isBonded: true, PIFs: [PIF_ID] })
const internalNetwork = createNetwork({ PIFs: [] })
const privateNetwork = createNetwork({
  PIFs: [PIF_ID],
  other_config: { [SDN_CONTROLLER_PRIVATE_NETWORK_UUID_KEY]: 'private-network-1' },
})

function getDeleteModalSubject(networks: FrontXoNetwork[]) {
  mountComposable(() => useNetworkDelete(networks)).wrapper.vm.deleteNetworks()

  return openDeleteModal.mock.lastCall?.[0].props.subject
}

describe('deleteNetworks', () => {
  it('names a physical network as a network', () => {
    expect(getDeleteModalSubject([physicalNetwork])).toBe(t('n-networks', { n: 1 }))
  })

  it('names a bonded network as a bonded network', () => {
    expect(getDeleteModalSubject([bondedNetwork])).toBe(t('n-bonded-networks', { n: 1 }))
  })

  it('names an internal network as an internal network', () => {
    expect(getDeleteModalSubject([internalNetwork])).toBe(t('n-internal-networks', { n: 1 }))
  })

  it('names a private network as a private network', () => {
    expect(getDeleteModalSubject([privateNetwork])).toBe(t('n-private-networks', { n: 1 }))
  })

  it('counts the networks to delete in the name', () => {
    expect(getDeleteModalSubject([privateNetwork, privateNetwork])).toBe(t('n-private-networks', { n: 2 }))
  })
})
