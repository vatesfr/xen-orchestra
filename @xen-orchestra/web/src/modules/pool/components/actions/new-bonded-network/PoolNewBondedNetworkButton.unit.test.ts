import { useNewBondedNetwork } from '@/modules/network/composables/use-new-bonded-network.composable.ts'
import PoolNewBondedNetworkButton from '@/modules/pool/components/actions/new-bonded-network/PoolNewBondedNetworkButton.vue'
import { createJobStub } from '@/test/create-job-result.ts'
import { createPool } from '@/test/create-pool.ts'
import { t } from '@/test/i18n.ts'
import { itRunsJobFromButton } from '@/test/job-button.ts'
import MenuTrigger from '@core/components/menu/MenuTrigger.vue'

// The composable runs the creation job, which calls the REST API
const newBondedNetwork = createJobStub(useNewBondedNetwork, result => ({
  openNewBondedNetworkDrawer: result.run,
  isCreatingBondedNetwork: result.isRunning,
}))

itRunsJobFromButton(PoolNewBondedNetworkButton, {
  targetProp: 'pool',
  createTarget: createPool,
  getButton: wrapper => wrapper.getComponent(MenuTrigger),
  job: newBondedNetwork,
  offer: { label: t('action:create-bonded-network'), icon: 'fa:plus' },
  // The composable receives the pool as a getter
  toJobTarget: pool => pool,
  disabledWhenCannotRun: false,
})
