import PoolAddNewHostButton from '@/modules/pool/components/actions/add-host/PoolAddNewHostButton.vue'
import { usePoolNewHost } from '@/modules/pool/composables/use-pool-new-host.composable.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { createJobStub, toJobComposableResult } from '@/test/create-job-result.ts'
import { findTooltipContent } from '@/test/find-tooltip-content.ts'
import { t } from '@/test/i18n.ts'
import { itRunsJobFromButton } from '@/test/job-button.ts'
import MenuTrigger from '@core/components/menu/MenuTrigger.vue'

const newHost = createJobStub(usePoolNewHost, result => toJobComposableResult(result, 'addNewHost', 'isAddingNewHost'))

itRunsJobFromButton(PoolAddNewHostButton, {
  targetProp: 'poolId',
  createTarget: () => 'pool-1' as FrontXoPool['id'],
  getButton: wrapper => wrapper.getComponent(MenuTrigger),
  job: newHost,
  offer: { label: t('new-host'), icon: 'action:add' },
  // The composable receives the pool id as a getter
  toJobTarget: poolId => poolId,
  errorMessage: t('job:arg:pool-id-required'),
  readHint: wrapper => findTooltipContent(wrapper.element),
})
