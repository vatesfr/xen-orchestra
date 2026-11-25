import { useNetworkDelete } from '@/modules/network/composables/use-network-delete.composable.ts'
import { useXoNetworkDeleteJob } from '@/modules/network/jobs/xo-network-delete.job.ts'
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { createJobStub } from '@/test/create-job-result.ts'
import { BONDED_NETWORK, INTERNAL_NETWORK, PHYSICAL_NETWORK, PRIVATE_NETWORK } from '@/test/create-network.ts'
import { t } from '@/test/i18n.ts'
import { deleteModalMock, mockDeleteModal } from '@/test/mock-delete-modal.ts'
import { mockOverlay, overlayMock } from '@/test/mock-overlay.ts'
import { mountComposable } from '@/test/mount-composable.ts'

// The job deletes the networks through the REST API
const deleteJob = createJobStub(useXoNetworkDeleteJob)

mockDeleteModal()

// The error modal is the only overlay the composable opens directly
mockOverlay()

beforeEach(() => {
  deleteJob.reset()
  deleteModalMock.reset()
  overlayMock.reset()
})

function getDeleteModalSubject(networks: FrontXoNetwork[]) {
  mountComposable(() => useNetworkDelete(networks)).wrapper.vm.deleteNetworks()

  return deleteModalMock.open.mock.lastCall?.[0].props.subject
}

describe('deleteNetworks', () => {
  it.each([
    { kind: 'a physical network as a network', network: PHYSICAL_NETWORK, subject: t('n-networks', { n: 1 }) },
    {
      kind: 'a bonded network as a bonded network',
      network: BONDED_NETWORK,
      subject: t('n-bonded-networks', { n: 1 }),
    },
    {
      kind: 'an internal network as an internal network',
      network: INTERNAL_NETWORK,
      subject: t('n-internal-networks', { n: 1 }),
    },
    {
      kind: 'a private network as a private network',
      network: PRIVATE_NETWORK,
      subject: t('n-private-networks', { n: 1 }),
    },
  ])('names $kind', ({ network, subject }) => {
    expect(getDeleteModalSubject([network])).toBe(subject)
  })

  it('counts the networks to delete in the name', () => {
    expect(getDeleteModalSubject([PRIVATE_NETWORK, PRIVATE_NETWORK])).toBe(t('n-private-networks', { n: 2 }))
  })
})
