import type { FrontXoVmSnapshot } from '@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-collection.ts'
import type { useXo5VmSnapshotRoute } from '@/modules/snapshot/composables/xo-vm-snapshot-route-xo5.composable.ts'
import VmSnapshotCard from '@/modules/vm/components/snapshot/cards/VmSnapshotCard.vue'
import { createVmSnapshot } from '@/test/create-vm-snapshot.ts'
import { findLabelledValues } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { d, t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

const { buildXo5VmSnapshotRoute } = vi.hoisted(() => ({
  buildXo5VmSnapshotRoute: vi.fn(),
}))

vi.mock(import('@/modules/snapshot/composables/xo-vm-snapshot-route-xo5.composable.ts'), () => ({
  useXo5VmSnapshotRoute: (() => ({ buildXo5VmSnapshotRoute })) as unknown as typeof useXo5VmSnapshotRoute,
}))

beforeEach(() => {
  buildXo5VmSnapshotRoute.mockReset()
  buildXo5VmSnapshotRoute.mockImplementation(
    (vmId: string, snapshotId: string) => `https://xo5.example.com/#/vms/${vmId}/snapshots?s=1_0_asc-${snapshotId}`
  )
})

function mountSnapshotCard(snapshot: FrontXoVmSnapshot | undefined, title = 'Oldest snapshot') {
  return mount(VmSnapshotCard, {
    props: { snapshot, title },
    global: createGlobalTestConfig(),
  })
}

it('renders the title it is given', () => {
  const wrapper = mountSnapshotCard(createVmSnapshot(), 'Latest snapshot')

  expect(wrapper.get('.ui-card-title').text()).toBe('Latest snapshot')
})

it('shows the name and the creation date of the snapshot', () => {
  const snapshot = createVmSnapshot({ name_label: 'Before upgrade' })

  const labelledValues = findLabelledValues(mountSnapshotCard(snapshot))

  expect(labelledValues[t('snapshot')]).toBe('Before upgrade')
  expect(labelledValues[t('snapshot-created-on')]).toBe(
    d(snapshot.snapshot_time * 1000, { dateStyle: 'short', timeStyle: 'medium' })
  )
})

it('links the snapshot to its XO 5 page', () => {
  const snapshot = createVmSnapshot({
    id: 'snapshot-42' as FrontXoVmSnapshot['id'],
    $snapshot_of: 'vm-42' as FrontXoVmSnapshot['$snapshot_of'],
  })

  const wrapper = mountSnapshotCard(snapshot)

  expect(wrapper.get('a').attributes('href')).toBe(
    'https://xo5.example.com/#/vms/vm-42/snapshots?s=1_0_asc-snapshot-42'
  )
})

it('offers to copy the snapshot name', () => {
  const wrapper = mountSnapshotCard(createVmSnapshot({ name_label: 'Before upgrade' }))

  expect(wrapper.find('.copy-button').exists()).toBe(true)
})

it('leaves both rows empty and offers no copy when there is no snapshot', () => {
  const wrapper = mountSnapshotCard(undefined)

  expect(findLabelledValues(wrapper)).toEqual({ [t('snapshot')]: '', [t('snapshot-created-on')]: '' })
  expect(wrapper.find('.copy-button').exists()).toBe(false)
})

it('shows no name and no copy button for an unnamed snapshot', () => {
  const wrapper = mountSnapshotCard(createVmSnapshot({ name_label: '' }))

  expect(findLabelledValues(wrapper)[t('snapshot')]).toBe('')
  expect(wrapper.find('.copy-button').exists()).toBe(false)
})
