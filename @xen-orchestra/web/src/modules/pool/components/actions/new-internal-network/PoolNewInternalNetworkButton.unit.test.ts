import { useNewInternalNetwork } from '@/modules/network/composables/use-new-internal-network.composable.ts'
import PoolNewInternalNetworkButton from '@/modules/pool/components/actions/new-internal-network/PoolNewInternalNetworkButton.vue'
import { createJobStub } from '@/test/create-job-result.ts'
import { createPool } from '@/test/create-pool.ts'
import { t } from '@/test/i18n.ts'
import { itRunsJobFromButton } from '@/test/job-button.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'

// The composable runs the creation job, which calls the REST API
const newInternalNetwork = createJobStub(useNewInternalNetwork, result => ({
  openNewInternalNetworkDrawer: result.run,
  isCreatingInternalNetwork: result.isRunning,
}))

const mountButton = itRunsJobFromButton(PoolNewInternalNetworkButton, {
  targetProp: 'pool',
  createTarget: createPool,
  getButton: wrapper => wrapper.getComponent(UiButton),
  job: newInternalNetwork,
  // The composable receives the pool as a getter
  toJobTarget: pool => pool,
  disabledWhenCannotRun: false,
})

it('offers to create an internal network', () => {
  const button = mountButton().getComponent(UiButton)

  expect(button.text()).toBe(t('new'))
  expect(button.props('leftIcon')).toBe('fa:plus')
})
