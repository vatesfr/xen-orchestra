import { usePoolConnection } from '@/modules/pool/composables/use-pool-connection.composable.ts'
import SiteHeader from '@/modules/site/components/SiteHeader.vue'
import { createJobStub } from '@/test/create-job-result.ts'
import { t } from '@/test/i18n.ts'
import { mountWithProps } from '@/test/mount-with-props.ts'
import { getUiButton } from '@core-test/get-button.ts'

const poolConnection = createJobStub(usePoolConnection, result => ({
  openPoolConnectionDrawer: result.run,
  isConnectingPool: result.isRunning,
}))

beforeEach(() => {
  poolConnection.reset()
})

function getConnectPoolButton() {
  return getUiButton(mountWithProps(SiteHeader, {}), t('action:connect-pool'))
}

it('offers to connect a pool', () => {
  expect(getConnectPoolButton().props('leftIcon')).toBe('fa:plus')
})

it('opens the pool connection drawer when clicking the button', async () => {
  await getConnectPoolButton().trigger('click')

  expect(poolConnection.run).toHaveBeenCalledOnce()
})

it('shows the button as busy while a pool is being connected', () => {
  poolConnection.setState({ isRunning: true })

  expect(getConnectPoolButton().props('busy')).toBe(true)
})
