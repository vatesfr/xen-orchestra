import { useXoPluginConfigurationDelete } from '@/modules/plugin/composables/use-xo-plugin-configuration-delete.composable.ts'
import type { useXoPluginDeleteConfigurationJob } from '@/modules/plugin/jobs/xo-plugin-delete-configuration.job.ts'
import { useActionError } from '@/shared/composables/action-error.composable.ts'
import { createJobResult } from '@/test/create-job-result.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import type { useDeleteModal } from '@core/composables/modals/use-delete-modal.ts'
import { useI18n } from 'vue-i18n'

const { run, useDeleteConfigurationJob, openModal } = vi.hoisted(() => ({
  run: vi.fn(),
  useDeleteConfigurationJob: vi.fn(),
  openModal: vi.fn(),
}))

vi.mock(import('@/modules/plugin/jobs/xo-plugin-delete-configuration.job.ts'), () => ({
  useXoPluginDeleteConfigurationJob: useDeleteConfigurationJob as unknown as typeof useXoPluginDeleteConfigurationJob,
}))

vi.mock(import('@core/composables/modals/use-delete-modal.ts'), () => ({
  useDeleteModal: (() => ({ open: openModal })) as unknown as typeof useDeleteModal,
}))

beforeEach(() => {
  run.mockReset().mockResolvedValue(undefined)
  useDeleteConfigurationJob.mockReset().mockReturnValue(createJobResult(run))
  openModal.mockReset()
})

const plugin = createPlugin({
  configuration: { from: { address: 'xo@example.org' }, transport: { host: 'smtp.example.org' } },
})

function mountDelete() {
  const onSuccess = vi.fn()

  const { wrapper } = mountComposable(() => {
    const { error, runAction } = useActionError()

    return { ...useXoPluginConfigurationDelete(plugin, { runAction, onSuccess }), error, t: useI18n().t }
  })

  return { result: wrapper.vm, onSuccess }
}

async function confirmDeletion() {
  await openModal.mock.calls[0][0].events.onConfirm()
}

it('asks to confirm the deletion of the configuration of the plugin', () => {
  const { result } = mountDelete()

  result.deleteConfiguration()

  expect(openModal.mock.calls[0][0].props).toEqual({
    subject: result.t('plugin:configuration-of', { name: 'transport-email' }),
    description: result.t('plugin:delete-configuration-info'),
    confirmLabel: result.t('action:delete-configuration'),
  })
})

it('does not delete anything until confirmed', () => {
  mountDelete().result.deleteConfiguration()

  expect(run).not.toHaveBeenCalled()
})

it('deletes the configuration once confirmed', async () => {
  const { result, onSuccess } = mountDelete()

  result.deleteConfiguration()
  await confirmDeletion()

  expect({ runs: run.mock.calls.length, successes: onSuccess.mock.calls.length }).toEqual({
    runs: 1,
    successes: 1,
  })
})

it('keeps the error of a failed deletion', async () => {
  const error = new Error('request failed')
  run.mockRejectedValue(error)
  const { result, onSuccess } = mountDelete()

  result.deleteConfiguration()
  await confirmDeletion()

  expect({ error: result.error, successes: onSuccess.mock.calls.length }).toEqual({ error, successes: 0 })
})
