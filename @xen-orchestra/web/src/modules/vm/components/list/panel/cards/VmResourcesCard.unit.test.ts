import type { FrontXoVbd, useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import VmResourcesCard from '@/modules/vm/components/list/panel/cards/VmResourcesCard.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createVbd } from '@/test/create-vbd.ts'
import { createVdi } from '@/test/create-vdi.ts'
import { createVm } from '@/test/create-vm.ts'
import { findCardLabelledValues } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { mount } from '@vue/test-utils'

const { getVbdsByIds } = vi.hoisted(() => ({
  getVbdsByIds: vi.fn(),
}))

const { getVdiById } = vi.hoisted(() => ({
  getVdiById: vi.fn(),
}))

vi.mock(import('@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'), () => ({
  useXoVbdCollection: (() => ({ getVbdsByIds })) as unknown as typeof useXoVbdCollection,
}))

vi.mock(import('@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'), () => ({
  useXoVdiCollection: (() => ({ getVdiById })) as unknown as typeof useXoVdiCollection,
}))

beforeEach(() => {
  getVbdsByIds.mockReset()
  getVdiById.mockReset()
  getVbdsByIds.mockReturnValue([])
  getVdiById.mockReturnValue(undefined)
})

function mountResourcesCard(vm: FrontXoVm = createVm()) {
  return mount(VmResourcesCard, {
    props: { vm },
    global: createGlobalTestConfig(),
  })
}

function attachVdis(...sizes: number[]) {
  const vbds = sizes.map((_, index) => createVbd({ VDI: `vdi-${index}` as FrontXoVbd['VDI'] }))

  getVbdsByIds.mockReturnValue(vbds)
  getVdiById.mockImplementation((id: string) => createVdi({ size: sizes[Number(id.split('-')[1])] }))
}

it('renders the card title', () => {
  const wrapper = mountResourcesCard()

  expect(wrapper.get('.ui-card-title .title').text()).toBe('Resources')
})

it('shows the vCPU count, the formatted RAM and the summed disk space of the VM', () => {
  attachVdis(1073741824, 2147483648)

  const wrapper = mountResourcesCard(
    createVm({
      CPUs: { number: 2, max: 4 },
      memory: { size: 4294967296, dynamic: [0, 0], static: [0, 0] },
      snapshots: ['snapshot-1'] as FrontXoVm['snapshots'],
    })
  )

  expect(findCardLabelledValues(wrapper)).toEqual({
    vCPUs: '2',
    RAM: '4 GiB',
    'Disk space': '3 GiB',
    VDIs: '2',
    Snapshots: '1',
  })
})

it('ignores the VBDs whose VDI cannot be resolved when summing the disk space', () => {
  getVbdsByIds.mockReturnValue([
    createVbd({ VDI: 'vdi-a' as FrontXoVbd['VDI'] }),
    createVbd({ VDI: 'vdi-missing' as FrontXoVbd['VDI'] }),
  ])
  getVdiById.mockImplementation((id: string) => (id === 'vdi-a' ? createVdi({ size: 1073741824 }) : undefined))

  expect(findCardLabelledValues(mountResourcesCard())).toMatchObject({ 'Disk space': '1 GiB' })
})

it('leaves the VDI and snapshot counts empty when the VM has none', () => {
  const wrapper = mountResourcesCard(createVm({ $VBDs: [], snapshots: [] }))

  expect(findCardLabelledValues(wrapper)).toMatchObject({ VDIs: '', Snapshots: '', 'Disk space': '0 B' })
})
