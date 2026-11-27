import ApplianceHealthCheckButton from '@/modules/appliance/components/actions/health-check/ApplianceHealthCheckButton.vue'
import { useXoaHealthCheckJob } from '@/modules/appliance/jobs/xoa-health-check.job.ts'
import { useXoaHealthCheck } from '@/modules/appliance/remote-resources/use-xoa-health-check.ts'
import { createJobStub } from '@/test/create-job-result.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mockedExport } from '@/test/spy-on-module.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { mount } from '@vue/test-utils'

const healthCheckJob = createJobStub(useXoaHealthCheckJob)

const healthCheckResource = mockedExport(useXoaHealthCheck)

const reloadHealthCheck = vi.fn()

beforeEach(() => {
  healthCheckJob.reset()

  reloadHealthCheck.mockReset()
  healthCheckResource.mockReturnValue({ reloadHealthCheck })
})

function mountButton() {
  return mount(ApplianceHealthCheckButton, { global: createGlobalTestConfig() }).getComponent(UiButton)
}

it('offers to run a health check', () => {
  const button = mountButton()

  expect(button.text()).toBe(t('action:run-health-check'))
  expect(button.props('leftIcon')).toBe('action:health-check')
})

it('runs the health check in the background when clicking the button', async () => {
  await mountButton().trigger('click')

  expect(healthCheckJob.run).toHaveBeenCalledWith({ detached: true, onSuccess: expect.any(Function) })
})

it('reloads the health check once it has run', async () => {
  await mountButton().trigger('click')

  const [{ onSuccess }] = healthCheckJob.run.mock.lastCall as [{ onSuccess: () => void }]
  onSuccess()

  expect(reloadHealthCheck).toHaveBeenCalledOnce()
})

it('shows the button as busy while the health check runs', () => {
  healthCheckJob.setState({ isRunning: true })

  expect(mountButton().props('busy')).toBe(true)
})
