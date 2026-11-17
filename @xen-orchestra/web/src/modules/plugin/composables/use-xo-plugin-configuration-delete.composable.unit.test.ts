import { useXoPluginConfigurationDelete } from '@/modules/plugin/composables/use-xo-plugin-configuration-delete.composable.ts'
import type { useXoPluginDeleteConfigurationJob } from '@/modules/plugin/jobs/xo-plugin-delete-configuration.job.ts'
import { createJobResult } from '@/test/create-job-result.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import type { useDeleteModal } from '@core/composables/modals/use-delete-modal.ts'

const { run, useDeleteConfigurationJob, openModal } = vi.hoisted(() => ({
  run: vi.fn(),
  useDeleteConfigurationJob: vi.fn(),
  openModal: vi.fn(),
}))

// The job deletes the configuration through the REST API
vi.mock(import('@/modules/plugin/jobs/xo-plugin-delete-configuration.job.ts'), () => ({
  useXoPluginDeleteConfigurationJob: useDeleteConfigurationJob as unknown as typeof useXoPluginDeleteConfigurationJob,
}))

vi.mock(import('@core/composables/modals/use-delete-modal.ts'), () => ({
  useDeleteModal: (() => ({ open: openModal })) as unknown as typeof useDeleteModal,
}))

beforeEach(() => {
  run.mockReset()
  useDeleteConfigurationJob.mockReset().mockReturnValue(createJobResult(run))
  openModal.mockReset()
})

const plugin = createPlugin({
  loaded: false,
  configuration: { from: { address: 'xo@example.org' }, transport: { host: 'smtp.example.org' } },
})

function mountDelete() {
  return mountComposable(() => useXoPluginConfigurationDelete(plugin)).wrapper.vm
}

function confirmDeletion() {
  openModal.mock.calls[0][0].events.onConfirm()
}

it('asks to confirm the deletion of the configuration of the plugin', () => {
  mountDelete().deleteConfiguration()

  expect(openModal.mock.calls[0][0].props).toEqual({
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

  confirmDeletion()

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
