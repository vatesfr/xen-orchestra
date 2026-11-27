import { useNewNetwork } from '@/modules/network/composables/use-new-network.composable.ts'
import PoolNewNetworkButton from '@/modules/pool/components/actions/new-network/PoolNewNetworkButton.vue'
import { createJobStub } from '@/test/create-job-result.ts'
import { createPool } from '@/test/create-pool.ts'
import { t } from '@/test/i18n.ts'
import { itRunsJobFromButton } from '@/test/job-button.ts'
import { getMenuTrigger } from '@core-test/menu.ts'

// The composable runs the creation job, which calls the REST API
const newNetwork = createJobStub(useNewNetwork, result => ({
  openNewNetworkDrawer: result.run,
  isCreatingNetwork: result.isRunning,
}))

itRunsJobFromButton(PoolNewNetworkButton, {
  targetProp: 'pool',
  createTarget: createPool,
  getButton: getMenuTrigger,
  job: newNetwork,
  offer: { label: t('action:create-network'), icon: 'fa:plus' },
  // The composable receives the pool as a getter
  toJobTarget: pool => pool,
  disabledWhenCannotRun: false,
})
