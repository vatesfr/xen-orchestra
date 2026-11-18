import VmHeaderActions from '@/modules/vm/components/actions/VmHeaderActions.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createVm } from '@/test/create-vm.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import {
  findHeadBarActionLabels,
  findMenuEntries,
  findMenuEntryIndex,
  openMoreActions,
} from '@/test/head-bar-actions.ts'
import { t } from '@/test/i18n.ts'
import { collapseOnOverflowMock } from '@/test/mock-collapse-on-overflow.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { taskCollectionMock } from '@/test/mock-xo-task-collection.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import UiDropdownButton from '@core/components/ui/dropdown-button/UiDropdownButton.vue'
import { VM_POWER_STATE } from '@vates/types'
import { mount } from '@vue/test-utils'

const { collapsedCount, resetCollapsedCount } = collapseOnOverflowMock

mockModule(import('@/shared/remote-resources/use-xo-routes.ts'), () => import('@/test/mock-xo-routes.ts'))

mockModule(
  import('@/modules/host/remote-resources/use-xo-host-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

mockModule(
  import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

mockModule(
  import('@/modules/task/remote-resources/use-xo-task-collection.ts'),
  () => import('@/test/mock-xo-task-collection.ts')
)

mockModule(
  import('@core/composables/collapse-on-overflow.composable.ts'),
  () => import('@/test/mock-collapse-on-overflow.ts')
)

beforeEach(() => {
  xoCollectionsMock.reset()
  taskCollectionMock.reset()
  collapseOnOverflowMock.reset()
})

function mountActions(vm: FrontXoVm = createVm({ id: 'vm-42' as FrontXoVm['id'] })) {
  return mount(VmHeaderActions, { props: { vm }, global: createGlobalTestConfig() })
}

describe('when every quick action fits', () => {
  it('shows the state-change and common quick actions of a running VM in the header', () => {
    const wrapper = mountActions()

    expect(findHeadBarActionLabels(wrapper)).toEqual([
      t('action:shutdown'),
      t('action:reboot'),
      t('action:migrate'),
      t('snapshot'),
    ])
    expect(wrapper.findComponent(UiDropdownButton).exists()).toBe(false)
  })

  it('shows the start action of a halted VM in the header', () => {
    const wrapper = mountActions(createVm({ power_state: VM_POWER_STATE.HALTED }))

    expect(findHeadBarActionLabels(wrapper)).toEqual([t('action:start'), t('action:migrate'), t('snapshot')])
  })

  it('shows the forced shutdown and reboot in the header when the VM has no guest tools', async () => {
    const wrapper = mountActions(createVm({ managementAgentDetected: false }))

    await openMoreActions(wrapper)

    expect(findHeadBarActionLabels(wrapper)).toEqual([
      t('action:force-shutdown'),
      t('action:force-reboot'),
      t('action:migrate'),
      t('snapshot'),
    ])
    expect(findMenuEntryIndex(wrapper, t('action:shutdown'))).toBeGreaterThan(
      findMenuEntryIndex(wrapper, t('action:change-state'))
    )
    expect(findMenuEntryIndex(wrapper, t('action:reboot'))).toBeGreaterThan(
      findMenuEntryIndex(wrapper, t('action:change-state'))
    )
    expect(findMenuEntryIndex(wrapper, t('action:force-shutdown'))).toBe(-1)
    expect(findMenuEntryIndex(wrapper, t('action:force-reboot'))).toBe(-1)
  })

  it('starts the more actions menu with the link to XO 5, then the change state and actions sections', async () => {
    const wrapper = mountActions()

    await openMoreActions(wrapper)

    const entries = findMenuEntries(wrapper)

    expect(entries[0]).toBe(t('action:manage-in-xo-5'))
    expect(entries[1]).toBe(t('action:change-state'))
    expect(entries).toContain(t('actions'))
    expect(entries.at(-1)).toBe(t('action:delete'))
    expect(document.body.querySelector('ul.menu-list a')?.getAttribute('href')).toBe(
      'https://xo5.example.com/#/vms/vm-42/general'
    )
  })

  it('keeps the quick actions out of the more actions menu', async () => {
    const wrapper = mountActions()

    await openMoreActions(wrapper)

    for (const label of [t('action:shutdown'), t('action:reboot'), t('action:migrate'), t('snapshot')]) {
      expect(findMenuEntries(wrapper)).not.toContain(label)
    }
  })
})

describe('when the quick actions do not fit', () => {
  it('moves the last quick actions into the actions section of the menu', async () => {
    collapsedCount.value = 2

    const wrapper = mountActions()

    await openMoreActions(wrapper)

    expect(findHeadBarActionLabels(wrapper)).toEqual([t('action:shutdown'), t('action:reboot')])
    expect(findMenuEntryIndex(wrapper, t('action:migrate'))).toBe(findMenuEntryIndex(wrapper, t('actions')) + 1)
    expect(findMenuEntryIndex(wrapper, t('snapshot'))).toBe(findMenuEntryIndex(wrapper, t('actions')) + 2)
  })

  it('moves the state-change quick actions next to the forced ones in the change state section', async () => {
    collapsedCount.value = 4

    const wrapper = mountActions()

    await openMoreActions(wrapper)

    expect(findHeadBarActionLabels(wrapper)).toEqual([])
    expect(findMenuEntryIndex(wrapper, t('action:reboot'))).toBe(
      findMenuEntryIndex(wrapper, t('action:force-reboot')) - 1
    )
    expect(findMenuEntryIndex(wrapper, t('action:shutdown'))).toBe(
      findMenuEntryIndex(wrapper, t('action:force-shutdown')) - 1
    )
    expect(findMenuEntryIndex(wrapper, t('action:shutdown'))).toBeLessThan(findMenuEntryIndex(wrapper, t('actions')))
  })
})

it('measures the header again when the quick actions change with the power state', async () => {
  const wrapper = mountActions()

  await wrapper.setProps({ vm: createVm({ id: 'vm-42' as FrontXoVm['id'], power_state: VM_POWER_STATE.HALTED }) })

  expect(resetCollapsedCount).toHaveBeenCalledOnce()
})
