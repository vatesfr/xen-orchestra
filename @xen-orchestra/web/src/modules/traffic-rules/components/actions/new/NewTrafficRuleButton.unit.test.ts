import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import NewTrafficRuleButton from '@/modules/traffic-rules/components/actions/new/NewTrafficRuleButton.vue'
import { useNewTrafficRule } from '@/modules/traffic-rules/composables/use-new-traffic-rule.composable.ts'
import { createJobStub } from '@/test/create-job-result.ts'
import { createPool } from '@/test/create-pool.ts'
import { createVif } from '@/test/create-vif.ts'
import { t } from '@/test/i18n.ts'
import { itRunsJobFromButton } from '@/test/job-button.ts'
import { mountWithProps } from '@/test/mount-with-props.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { toValue } from 'vue'

// The composable runs the creation job, which calls the REST API
const newTrafficRule = createJobStub(useNewTrafficRule, result => ({
  openNewTrafficRuleDrawer: result.run,
  isCreatingTrafficRule: result.isRunning,
}))

const mountButton = itRunsJobFromButton(NewTrafficRuleButton, {
  targetProp: 'poolId',
  createTarget: (): FrontXoPool['id'] => createPool().id,
  getButton: wrapper => wrapper.getComponent(UiButton),
  job: newTrafficRule,
  // The composable receives the pool id as a getter
  toJobTarget: poolId => poolId,
  disabledWhenCannotRun: false,
})

it('offers to create a traffic rule', () => {
  const button = mountButton().getComponent(UiButton)

  expect(button.text()).toBe(t('new'))
  expect(button.props('leftIcon')).toBe('fa:plus')
})

it('creates the traffic rule on the VIF it is given', () => {
  const vif = createVif()

  mountWithProps(NewTrafficRuleButton, { poolId: vif.$pool, vifId: vif.id })

  const [, vifId] = newTrafficRule.use.mock.lastCall ?? []

  expect(toValue(vifId)).toBe(vif.id)
})
