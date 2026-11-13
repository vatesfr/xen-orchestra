import type { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { useXoTaskCollection } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import VmMainActions from '@/modules/vm/components/actions/VmMainActions.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import { createVm } from '@/test/create-vm.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import UiDropdownButton from '@core/components/ui/dropdown-button/UiDropdownButton.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { IK_PANEL_ACTIONS_COMPACT } from '@core/utils/injection-keys.util.ts'
import { mount } from '@vue/test-utils'
import { computed, nextTick } from 'vue'

const { buildXo5Route } = vi.hoisted(() => ({
  buildXo5Route: vi.fn(),
}))

vi.mock(import('@/shared/remote-resources/use-xo-routes.ts'), () => ({
  useXoRoutes: (() => ({ buildXo5Route })) as unknown as typeof useXoRoutes,
}))

vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: (() => ({ getHostById: () => undefined })) as unknown as typeof useXoHostCollection,
}))

vi.mock(import('@/modules/task/remote-resources/use-xo-task-collection.ts'), () => ({
  useXoTaskCollection: (() => ({ useGetTaskById: () => undefined })) as unknown as typeof useXoTaskCollection,
}))

beforeEach(() => {
  buildXo5Route.mockReset()
  buildXo5Route.mockImplementation((path: string) => `https://xo5.example.com/#${path}`)
})

function mountActions({ showXo5Link = false, isPanelCompact = false } = {}) {
  return mount(VmMainActions, {
    props: { vm: createVm({ id: 'vm-42' as FrontXoVm['id'] }), showXo5Link },
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

function findXo5Links(wrapper: ReturnType<typeof mountActions>) {
  return wrapper
    .findAllComponents(UiLink)
    .filter(link => link.text() === t('action:manage-in-xo-5'))
    .map(link => link.attributes('href'))
}

function findMenuItemLabels(wrapper: ReturnType<typeof mountActions>) {
  return wrapper.findAllComponents(MenuItem).map(item => item.text())
}

describe('when the actions fit', () => {
  it('shows the link to manage the VM in XO 5 next to the state-change dropdown', () => {
    const wrapper = mountActions({ showXo5Link: true })

    expect(findXo5Links(wrapper)).toEqual(['https://xo5.example.com/#/vms/vm-42/general'])
    expect(wrapper.getComponent(UiDropdownButton).text()).toBe(t('action:change-state'))
  })

  it('shows no link to XO 5 when it is not requested', () => {
    const wrapper = mountActions()

    expect(findXo5Links(wrapper)).toEqual([])
  })

  it('keeps the state change out of the more actions menu', async () => {
    const wrapper = mountActions({ showXo5Link: true })

    await openMoreActions(wrapper)

    expect(findMenuItemLabels(wrapper)).not.toContain(t('action:change-state'))
  })
})

describe('when the panel is too narrow', () => {
  it('only shows the more actions button', () => {
    const wrapper = mountActions({ showXo5Link: true, isPanelCompact: true })

    expect(wrapper.findComponent(UiDropdownButton).exists()).toBe(false)
    expect(findXo5Links(wrapper)).toEqual([])
    expect(wrapper.get('button.ui-button-icon').attributes('aria-label')).toBe(t('more-actions'))
  })

  it('moves the link to XO 5 and the state change into the more actions menu', async () => {
    const wrapper = mountActions({ showXo5Link: true, isPanelCompact: true })

    await openMoreActions(wrapper)

    expect(findXo5Links(wrapper)).toEqual(['https://xo5.example.com/#/vms/vm-42/general'])
    expect(findMenuItemLabels(wrapper)).toContain(t('action:change-state'))
  })
})
