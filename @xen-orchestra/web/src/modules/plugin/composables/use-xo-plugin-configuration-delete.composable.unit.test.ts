import { useXoPluginConfigurationDelete } from '@/modules/plugin/composables/use-xo-plugin-configuration-delete.composable.ts'
import { useXoPluginDeleteConfigurationJob } from '@/modules/plugin/jobs/xo-plugin-delete-configuration.job.ts'
import { createJobResult } from '@/test/create-job-result.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { t } from '@/test/i18n.ts'
import { deleteModalMock } from '@/test/mock-delete-modal.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mockModule, mockedExport } from '@/test/spy-on-module.ts'

// The job deletes the configuration through the REST API
const useDeleteConfigurationJob = mockedExport(useXoPluginDeleteConfigurationJob)

const run = vi.fn()

mockModule(import('@core/composables/modals/use-delete-modal.ts'), () => import('@/test/mock-delete-modal.ts'))

beforeEach(() => {
  run.mockReset()
  useDeleteConfigurationJob.mockReturnValue(createJobResult(run))
  deleteModalMock.reset()
})

const plugin = createPlugin({
  loaded: false,
  configuration: { from: { address: 'xo@example.org' }, transport: { host: 'smtp.example.org' } },
})

function mountDelete() {
  return mountComposable(() => useXoPluginConfigurationDelete(plugin)).wrapper.vm
}

it('asks to confirm the deletion of the configuration of the plugin', () => {
  mountDelete().deleteConfiguration()

  expect(deleteModalMock.open.mock.calls[0][0].props).toEqual({
    subject: t('plugin:configuration-of', { name: 'transport-email' }),
    description: t('plugin:delete-configuration-info'),
    confirmLabel: t('action:delete-configuration'),
  })
})

it('does not delete anything until confirmed', () => {
  mountDelete().deleteConfiguration()

  expect(run).not.toHaveBeenCalled()
})

it('deletes the configuration in the background once confirmed, so the modal closes right away', () => {
  mountDelete().deleteConfiguration()

  deleteModalMock.confirm()

  expect(run).toHaveBeenCalledWith({ detached: true })
})

it('exposes whether the configuration can be deleted, is being deleted, and why it cannot be', () => {
  useDeleteConfigurationJob.mockReturnValue(
    createJobResult(run, { canRun: false, isRunning: true, errorMessage: 'In progress' })
  )

  const result = mountDelete()

  expect(result.canDeleteConfiguration).toBe(false)
  expect(result.isDeletingConfiguration).toBe(true)
  expect(result.deleteConfigurationErrorMessage).toBe('In progress')
})
