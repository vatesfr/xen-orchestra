import VbdConnectButton from '@/modules/vbd/components/actions/connect/VbdConnectButton.vue'
import VbdDeleteButton from '@/modules/vbd/components/actions/delete/VbdDeleteButton.vue'
import VbdDisconnectButton from '@/modules/vbd/components/actions/disconnect/VbdDisconnectButton.vue'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdiDeleteButton from '@/modules/vdi/components/actions/delete/VdiDeleteButton.vue'
import VdiMigrateButton from '@/modules/vdi/components/actions/migrate/VdiMigrateButton.vue'
import VdiConfigurationSidepanelCard from '@/modules/vdi/components/list/panel/cards/VdiConfigurationSidepanelCard.vue'
import VdiInfosSidepanelCard from '@/modules/vdi/components/list/panel/cards/VdiInfosSidepanelCard.vue'
import VdiSidePanel from '@/modules/vdi/components/list/panel/VdiSidePanel.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { VDI_PAGE_CONTEXT, type VdiPageContext } from '@/shared/constants.ts'
import { createVbd } from '@/test/create-vbd.ts'
import { createVdi } from '@/test/create-vdi.ts'
import { createVm } from '@/test/create-vm.ts'
import { findShownComponents } from '@/test/find-shown-components.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { mockXoVmDeviceCollections, vmDeviceCollectionsMock } from '@/test/mock-xo-vm-device-collections.ts'
import { mount } from '@vue/test-utils'

mockXoVmDeviceCollections('vbd')

beforeEach(() => {
  vmDeviceCollectionsMock.reset()
})

const vm = createVm({ id: 'vm-1' as FrontXoVm['id'] })

// Each action and card is covered by its own test: this one only asserts which are shown, and what they are given
const global = {
  ...createGlobalTestConfig(),
  stubs: {
    VbdConnectButton: true,
    VbdDisconnectButton: true,
    VbdDeleteButton: true,
    VdiMigrateButton: true,
    VdiDeleteButton: true,
    VdiImportExportMenu: true,
    VdiInfosSidepanelCard: true,
    VdiSpaceSidepanelCard: true,
    VdiConfigurationSidepanelCard: true,
  },
}

// The panel of a VDI plugged into `vm-1` through a VBD attached or not, shown for `panelVm`
function mountSidePanel({
  panelVm,
  attached = false,
  fromContext = VDI_PAGE_CONTEXT.VM,
}: {
  panelVm?: FrontXoVm
  attached?: boolean
  fromContext?: VdiPageContext
}) {
  vmDeviceCollectionsMock.vbds.value = [
    createVbd({ id: 'vbd-1' as FrontXoVbd['id'], VM: vm.id as FrontXoVbd['VM'], attached }),
  ]

  return mount(VdiSidePanel, {
    props: { vdi: createVdi({ $VBDs: ['vbd-1' as FrontXoVbd['id']] }), vm: panelVm, fromContext },
    global,
  })
}

const VBD_ACTIONS = [VbdConnectButton, VbdDisconnectButton, VbdDeleteButton]

it.each([
  { context: 'for the VM it is plugged into', panelVm: vm },
  { context: 'without a VM', panelVm: undefined },
  { context: 'for another VM', panelVm: createVm({ id: 'vm-other' as FrontXoVm['id'] }) },
])('always offers to migrate and delete the VDI — $context', ({ panelVm }) => {
  const wrapper = mountSidePanel({ panelVm })

  expect(findShownComponents(wrapper, [VdiMigrateButton, VdiDeleteButton])).toEqual([VdiMigrateButton, VdiDeleteButton])
})

it.each([
  { attached: false, actions: [VbdConnectButton, VbdDeleteButton] },
  { attached: true, actions: [VbdDisconnectButton, VbdDeleteButton] },
])(
  'offers to connect or disconnect and detach the VDI for the VM it is plugged into — attached: $attached',
  ({ attached, actions }) => {
    const wrapper = mountSidePanel({ panelVm: vm, attached })

    expect(findShownComponents(wrapper, VBD_ACTIONS)).toEqual(actions)
  }
)

it.each([
  { context: 'without a VM', panelVm: undefined },
  { context: 'for a VM it is not plugged into', panelVm: createVm({ id: 'vm-other' as FrontXoVm['id'] }) },
])('offers no VBD action $context', ({ panelVm }) => {
  expect(findShownComponents(mountSidePanel({ panelVm }), VBD_ACTIONS)).toEqual([])
})

it.each([VdiInfosSidepanelCard, VdiConfigurationSidepanelCard])(
  'hands %s the VBD of the VM and the page it is opened from',
  card => {
    const wrapper = mountSidePanel({ panelVm: vm, fromContext: VDI_PAGE_CONTEXT.SR })

    expect(wrapper.getComponent(card).props('vbd')?.id).toBe('vbd-1')
    expect(wrapper.getComponent(card).props('fromContext')).toBe(VDI_PAGE_CONTEXT.SR)
  }
)

it.each([VdiInfosSidepanelCard, VdiConfigurationSidepanelCard])('hands %s no VBD without a VM', card => {
  expect(mountSidePanel({}).getComponent(card).props('vbd')).toBeUndefined()
})
