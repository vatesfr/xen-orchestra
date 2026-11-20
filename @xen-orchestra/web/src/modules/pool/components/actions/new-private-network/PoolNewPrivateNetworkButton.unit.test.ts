import type { useNewPrivateNetwork } from '@/modules/network/composables/use-new-private-network.composable.ts'
import PoolNewPrivateNetworkButton from '@/modules/pool/components/actions/new-private-network/PoolNewPrivateNetworkButton.vue'
import { createPool } from '@/test/create-pool.ts'
import { findTooltipContent } from '@/test/find-tooltip-content.ts'
import { getUiButton } from '@/test/get-button.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'
import { ref, toValue } from 'vue'

const { useNewNetwork, openDrawer } = vi.hoisted(() => ({
  useNewNetwork: vi.fn(),
  openDrawer: vi.fn(),
}))

// The composable runs the creation job, which calls the REST API
vi.mock(import('@/modules/network/composables/use-new-private-network.composable.ts'), () => ({
  useNewPrivateNetwork: useNewNetwork as unknown as typeof useNewPrivateNetwork,
}))

beforeEach(() => {
  useNewNetwork.mockReset()
  openDrawer.mockReset()

  mockNewPrivateNetwork()
})

function mockNewPrivateNetwork({
  canCreate = true,
  isCreating = false,
  isSdnControllerMissing = false,
}: { canCreate?: boolean; isCreating?: boolean; isSdnControllerMissing?: boolean } = {}) {
  useNewNetwork.mockReturnValue({
    openNewPrivateNetworkDrawer: openDrawer,
    isCreatingPrivateNetwork: ref(isCreating),
    canCreatePrivateNetwork: ref(canCreate),
    isSdnControllerMissing: ref(isSdnControllerMissing),
  })
}

function mountButton(pool = createPool()) {
  return mount(PoolNewPrivateNetworkButton, { props: { pool }, global: createGlobalTestConfig() })
}

function getNewButton(wrapper: ReturnType<typeof mountButton>) {
  return getUiButton(wrapper, t('new'))
}

it('creates the private network from the pool', () => {
  const pool = createPool()
  mountButton(pool)

  // The composable receives the pool as a getter
  expect(toValue(useNewNetwork.mock.lastCall?.[0])).toEqual(pool)
})

it('opens the drawer when clicking the button', async () => {
  await getNewButton(mountButton()).trigger('click')

  expect(openDrawer).toHaveBeenCalledOnce()
})

it('disables the button when a private network cannot be created', () => {
  mockNewPrivateNetwork({ canCreate: false })

  expect(getNewButton(mountButton()).props('disabled')).toBe(true)
})

it('shows the button as busy while the private network is being created', () => {
  mockNewPrivateNetwork({ isCreating: true })

  expect(getNewButton(mountButton()).props('busy')).toBe(true)
})

it('explains that the SDN controller plugin is required when it is missing', async () => {
  mockNewPrivateNetwork({ canCreate: false, isSdnControllerMissing: true })

  expect(await findTooltipContent(getNewButton(mountButton()).element)).toBe(t('sdn-controller-plugin-required'))
})

// The tooltip directive shows nothing for a falsy content
it('shows no tooltip when the SDN controller plugin is there', async () => {
  expect(await findTooltipContent(getNewButton(mountButton()).element)).toBeFalsy()
})
