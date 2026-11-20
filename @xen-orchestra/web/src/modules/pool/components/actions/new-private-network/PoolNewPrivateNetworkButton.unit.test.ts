import { useNewPrivateNetwork } from '@/modules/network/composables/use-new-private-network.composable.ts'
import PoolNewPrivateNetworkButton from '@/modules/pool/components/actions/new-private-network/PoolNewPrivateNetworkButton.vue'
import { createJobStub } from '@/test/create-job-result.ts'
import { createPool } from '@/test/create-pool.ts'
import { findTooltipContent } from '@/test/find-tooltip-content.ts'
import { t } from '@/test/i18n.ts'
import { itRunsJobFromButton } from '@/test/job-button.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import type { VueWrapper } from '@vue/test-utils'
import { ref } from 'vue'

const isSdnControllerMissing = ref(false)

// The composable runs the creation job, which calls the REST API
const newPrivateNetwork = createJobStub(useNewPrivateNetwork, result => ({
  openNewPrivateNetworkDrawer: result.run,
  canCreatePrivateNetwork: result.canRun,
  isCreatingPrivateNetwork: result.isRunning,
  isSdnControllerMissing,
}))

beforeEach(() => {
  isSdnControllerMissing.value = false
})

function getNewButton(wrapper: VueWrapper) {
  return wrapper.getComponent(UiButton)
}

const mountButton = itRunsJobFromButton(PoolNewPrivateNetworkButton, {
  targetProp: 'pool',
  createTarget: createPool,
  getButton: getNewButton,
  job: newPrivateNetwork,
  // The composable receives the pool as a getter
  toJobTarget: pool => pool,
})

it('explains that the SDN controller plugin is required when it is missing', async () => {
  newPrivateNetwork.setState({ canRun: false })
  isSdnControllerMissing.value = true

  expect(await findTooltipContent(getNewButton(mountButton()).element)).toBe(t('sdn-controller-plugin-required'))
})

// The tooltip directive shows nothing for a falsy content
it('shows no tooltip when the SDN controller plugin is there', async () => {
  expect(await findTooltipContent(getNewButton(mountButton()).element)).toBeFalsy()
})
