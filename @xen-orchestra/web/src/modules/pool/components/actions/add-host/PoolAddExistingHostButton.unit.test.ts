import PoolAddExistingHostButton from '@/modules/pool/components/actions/add-host/PoolAddExistingHostButton.vue'
import { usePoolExistingHost } from '@/modules/pool/composables/use-pool-existing-host.composable.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { createJobStub, toJobComposableResult } from '@/test/create-job-result.ts'
import { findTooltipContent } from '@/test/find-tooltip-content.ts'
import { t } from '@/test/i18n.ts'
import { itRunsJobFromButton } from '@/test/job-button.ts'
import { getMenuTrigger } from '@core-test/menu.ts'

const existingHost = createJobStub(usePoolExistingHost, result =>
  toJobComposableResult(result, 'addExistingHost', 'isAddingExistingHost')
)

itRunsJobFromButton(PoolAddExistingHostButton, {
  targetProp: 'poolId',
  createTarget: () => 'pool-1' as FrontXoPool['id'],
  getButton: getMenuTrigger,
  job: existingHost,
  offer: { label: t('existing-host'), icon: 'action:attach' },
  // The composable receives the pool id as a getter
  toJobTarget: poolId => poolId,
  errorMessage: t('job:arg:pool-id-required'),
  readHint: wrapper => findTooltipContent(wrapper.element),
})
