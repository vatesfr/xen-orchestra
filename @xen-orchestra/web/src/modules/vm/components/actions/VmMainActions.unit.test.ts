import VmMainActions from '@/modules/vm/components/actions/VmMainActions.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createVm } from '@/test/create-vm.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { taskCollectionMock } from '@/test/mock-xo-task-collection.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import UiDropdownButton from '@core/components/ui/dropdown-button/UiDropdownButton.vue'
import { IK_PANEL_ACTIONS_COMPACT } from '@core/utils/injection-keys.util.ts'
import { mount } from '@vue/test-utils'
import { computed, nextTick } from 'vue'

mockModule(import('@/shared/remote-resources/use-xo-routes.ts'), () => import('@/test/mock-xo-routes.ts'))

mockModule(
  import('@/modules/host/remote-resources/use-xo-host-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

mockModule(
  import('@/modules/task/remote-resources/use-xo-task-collection.ts'),
  () => import('@/test/mock-xo-task-collection.ts')
)

beforeEach(() => {
  xoCollectionsMock.reset()
  taskCollectionMock.reset()
})

function mountActions({ isPanelCompact = false } = {}) {
  return mount(VmMainActions, {
    props: { vm: createVm({ id: 'vm-42' as FrontXoVm['id'] }) },
    global: {
      ...createGlobalTestConfig(),
      provide: { [IK_PANEL_ACTIONS_COMPACT as symbol]: computed(() => isPanelCompact) },
    },
  })
}

async function openMoreActions(wrapper: ReturnType<typeof mountActions>) {
  await wrapper.get('button.ui-button-icon').trigger('click')
  await nextTick()
}

function findMenuItemLabels(wrapper: ReturnType<typeof mountActions>) {
  return wrapper.findAllComponents(MenuItem).map(item => item.text())
}

describe('when the actions fit', () => {
  it('shows the state-change dropdown', () => {
    const wrapper = mountActions()

    expect(wrapper.getComponent(UiDropdownButton).text()).toBe(t('action:change-state'))
  })

  it('keeps the state change out of the more actions menu', async () => {
    const wrapper = mountActions()

    await openMoreActions(wrapper)

    expect(findMenuItemLabels(wrapper)).not.toContain(t('action:change-state'))
  })
})

describe('when the panel is too narrow', () => {
  it('only shows the more actions button', () => {
    const wrapper = mountActions({ isPanelCompact: true })

    expect(wrapper.findComponent(UiDropdownButton).exists()).toBe(false)
    expect(wrapper.get('button.ui-button-icon').attributes('aria-label')).toBe(t('more-actions'))
  })

  it('moves the state change into the more actions menu', async () => {
    const wrapper = mountActions({ isPanelCompact: true })

    await openMoreActions(wrapper)

    expect(findMenuItemLabels(wrapper)).toContain(t('action:change-state'))
  })
})
