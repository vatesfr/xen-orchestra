import PoolAddExistingHostButton from '@/modules/pool/components/actions/add-host/PoolAddExistingHostButton.vue'
import type { usePoolExistingHost } from '@/modules/pool/composables/use-pool-existing-host.composable.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { findTooltipContent } from '@/test/find-tooltip-content.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { mount } from '@vue/test-utils'
import { ref, toValue } from 'vue'

const { useExistingHost, addExistingHost } = vi.hoisted(() => ({
  useExistingHost: vi.fn(),
  addExistingHost: vi.fn(),
}))

vi.mock(import('@/modules/pool/composables/use-pool-existing-host.composable.ts'), () => ({
  usePoolExistingHost: useExistingHost as unknown as typeof usePoolExistingHost,
}))

const isAddingExistingHost = ref(false)
const canAddExistingHost = ref(true)
const addExistingHostErrorMessage = ref<string | undefined>(undefined)

beforeEach(() => {
  addExistingHost.mockReset()
  useExistingHost.mockReset().mockReturnValue({
    addExistingHost,
    isAddingExistingHost,
    canAddExistingHost,
    addExistingHostErrorMessage,
  })

  isAddingExistingHost.value = false
  canAddExistingHost.value = true
  addExistingHostErrorMessage.value = undefined
})

const POOL_ID = 'pool-1' as FrontXoPool['id']

function mountButton() {
  return mount(PoolAddExistingHostButton, {
    props: { poolId: POOL_ID },
    global: createGlobalTestConfig(),
  })
}

it('adds an existing host to the pool', async () => {
  const wrapper = mountButton()

  await wrapper.get('.menu-trigger').trigger('click')

  expect(wrapper.text()).toBe(t('existing-host'))
  expect(toValue(useExistingHost.mock.lastCall?.[0])).toBe(POOL_ID)
  expect(addExistingHost).toHaveBeenCalledOnce()
})

it('is busy while a host is being added to the pool', () => {
  isAddingExistingHost.value = true

  expect(mountButton().getComponent(MenuItem).props('busy')).toBe(true)
})

it('is disabled with the reason when no host can be added to the pool', async () => {
  canAddExistingHost.value = false
  addExistingHostErrorMessage.value = t('job:arg:pool-id-required')

  const wrapper = mountButton()

  await wrapper.get('.menu-trigger').trigger('click')

  expect(wrapper.getComponent(MenuItem).props('disabled')).toBe(true)
  expect(await findTooltipContent(wrapper.getComponent(MenuItem).element)).toBe(t('job:arg:pool-id-required'))
  expect(addExistingHost).not.toHaveBeenCalled()
})
