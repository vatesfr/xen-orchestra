import { usePoolConnection } from '@/modules/pool/composables/use-pool-connection.composable.ts'
import SiteConnectPoolButton from '@/modules/site/components/actions/connect-pool/SiteConnectPoolButton.vue'
import { createJobStub } from '@/test/create-job-result.ts'
import { t } from '@/test/i18n.ts'
import { mountWithProps } from '@/test/mount-with-props.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { clickMenuItem } from '@core-test/menu.ts'

const poolConnection = createJobStub(usePoolConnection, result => ({
  openPoolConnectionDrawer: result.run,
  isConnectingPool: result.isRunning,
}))

beforeEach(() => {
  poolConnection.reset()
})

function mountButton() {
  return mountWithProps(SiteConnectPoolButton, {})
}

it('offers to connect a pool', () => {
  const item = mountButton().getComponent(MenuItem)

  expect(item.text()).toBe(t('action:connect-pool'))
  expect(item.props('icon')).toBe('action:connect')
})

it('opens the pool connection drawer when clicking it', async () => {
  await clickMenuItem(mountButton())

  expect(poolConnection.run).toHaveBeenCalledOnce()
})

it('is busy while a pool is being connected', () => {
  poolConnection.setState({ isRunning: true })

  expect(mountButton().getComponent(MenuItem).props('busy')).toBe(true)
})
