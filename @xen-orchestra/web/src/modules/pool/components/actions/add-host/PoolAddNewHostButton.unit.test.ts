import PoolAddNewHostButton from '@/modules/pool/components/actions/add-host/PoolAddNewHostButton.vue'
import type { usePoolNewHost } from '@/modules/pool/composables/use-pool-new-host.composable.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { findTooltipContent } from '@/test/find-tooltip-content.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { mount } from '@vue/test-utils'
import { ref, toValue } from 'vue'

const { useNewHost, addNewHost } = vi.hoisted(() => ({
  useNewHost: vi.fn(),
  addNewHost: vi.fn(),
}))

vi.mock(import('@/modules/pool/composables/use-pool-new-host.composable.ts'), () => ({
  usePoolNewHost: useNewHost as unknown as typeof usePoolNewHost,
}))

const isAddingNewHost = ref(false)
const canAddNewHost = ref(true)
const addNewHostErrorMessage = ref<string | undefined>(undefined)

beforeEach(() => {
  addNewHost.mockReset()
  useNewHost.mockReset().mockReturnValue({ addNewHost, isAddingNewHost, canAddNewHost, addNewHostErrorMessage })

  isAddingNewHost.value = false
  canAddNewHost.value = true
  addNewHostErrorMessage.value = undefined
})

const POOL_ID = 'pool-1' as FrontXoPool['id']

function mountButton() {
  return mount(PoolAddNewHostButton, {
    props: { poolId: POOL_ID },
    global: createGlobalTestConfig(),
  })
}

it('adds a new host to the pool', async () => {
  const wrapper = mountButton()

  await wrapper.get('.menu-trigger').trigger('click')

  expect(wrapper.text()).toBe(t('new-host'))
  expect(toValue(useNewHost.mock.lastCall?.[0])).toBe(POOL_ID)
  expect(addNewHost).toHaveBeenCalledOnce()
})

it('is busy while a host is being added to the pool', () => {
  isAddingNewHost.value = true

  expect(mountButton().getComponent(MenuItem).props('busy')).toBe(true)
})

it('is disabled with the reason when no host can be added to the pool', async () => {
  canAddNewHost.value = false
  addNewHostErrorMessage.value = t('job:arg:pool-id-required')

  const wrapper = mountButton()

  await wrapper.get('.menu-trigger').trigger('click')

  expect(wrapper.getComponent(MenuItem).props('disabled')).toBe(true)
  expect(await findTooltipContent(wrapper.getComponent(MenuItem).element)).toBe(t('job:arg:pool-id-required'))
  expect(addNewHost).not.toHaveBeenCalled()
})
