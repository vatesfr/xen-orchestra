import PoolAddHostButton from '@/modules/pool/components/actions/add-host/PoolAddHostButton.vue'
import type { usePoolExistingHost } from '@/modules/pool/composables/use-pool-existing-host.composable.ts'
import type { usePoolNewHost } from '@/modules/pool/composables/use-pool-new-host.composable.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import UiDropdownButton from '@core/components/ui/dropdown-button/UiDropdownButton.vue'
import { mount } from '@vue/test-utils'
import { nextTick, toValue } from 'vue'

const { useNewHost, useExistingHost, addNewHost, addExistingHost } = vi.hoisted(() => ({
  useNewHost: vi.fn(),
  useExistingHost: vi.fn(),
  addNewHost: vi.fn(),
  addExistingHost: vi.fn(),
}))

vi.mock(import('@/modules/pool/composables/use-pool-new-host.composable.ts'), () => ({
  usePoolNewHost: useNewHost as unknown as typeof usePoolNewHost,
}))

vi.mock(import('@/modules/pool/composables/use-pool-existing-host.composable.ts'), () => ({
  usePoolExistingHost: useExistingHost as unknown as typeof usePoolExistingHost,
}))

beforeEach(() => {
  useNewHost.mockReset().mockReturnValue({ addNewHost })
  useExistingHost.mockReset().mockReturnValue({ addExistingHost })
  addNewHost.mockReset()
  addExistingHost.mockReset()
})

const POOL_ID = 'pool-1' as FrontXoPool['id']

function mountButton() {
  return mount(PoolAddHostButton, {
    props: { poolId: POOL_ID },
    global: createGlobalTestConfig(),
  })
}

async function openMenu(wrapper: ReturnType<typeof mountButton>) {
  await wrapper.getComponent(UiDropdownButton).trigger('click')
  await nextTick()

  return wrapper.findAllComponents(MenuItem)
}

it('offers to add a host', () => {
  expect(mountButton().getComponent(UiDropdownButton).text()).toBe(t('action:add-host'))
})

it('adds the host to the pool', () => {
  mountButton()

  const [newHostPoolId] = useNewHost.mock.lastCall ?? []
  const [existingHostPoolId] = useExistingHost.mock.lastCall ?? []

  expect(toValue(newHostPoolId)).toBe(POOL_ID)
  expect(toValue(existingHostPoolId)).toBe(POOL_ID)
})

it('offers a new host or an existing host', async () => {
  const items = await openMenu(mountButton())

  expect(items.map(item => item.text())).toEqual([t('new-host'), t('existing-host')])
})

it('adds a new host when clicking its menu item', async () => {
  const [newHostItem] = await openMenu(mountButton())

  await newHostItem.get('.menu-trigger').trigger('click')

  expect(addNewHost).toHaveBeenCalledOnce()
  expect(addExistingHost).not.toHaveBeenCalled()
})

it('adds an existing host when clicking its menu item', async () => {
  const [, existingHostItem] = await openMenu(mountButton())

  await existingHostItem.get('.menu-trigger').trigger('click')

  expect(addExistingHost).toHaveBeenCalledOnce()
  expect(addNewHost).not.toHaveBeenCalled()
})
