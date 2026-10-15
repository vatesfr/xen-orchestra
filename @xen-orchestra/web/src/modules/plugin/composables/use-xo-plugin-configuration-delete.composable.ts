import { useXoPluginDeleteConfigurationJob } from '@/modules/plugin/jobs/xo-plugin-delete-configuration.job.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import type { useActionError } from '@/shared/composables/action-error.composable.ts'
import { useDeleteModal } from '@core/composables/modals/use-delete-modal.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useXoPluginConfigurationDelete(
  rawPlugin: MaybeRefOrGetter<FrontXoPlugin>,
  {
    runAction,
    onSuccess,
  }: {
    runAction: ReturnType<typeof useActionError>['runAction']
    onSuccess: () => void
  }
) {
  const plugin = toComputed(rawPlugin)

  const { t } = useI18n()

  const {
    run,
    canRun: canDeleteConfiguration,
    isRunning: isDeletingConfiguration,
    errorMessage: deleteConfigurationErrorMessage,
  } = useXoPluginDeleteConfigurationJob(plugin)

  const { open } = useDeleteModal()

  function deleteConfiguration() {
    return open({
      props: {
        subject: t('plugin:configuration-of', { name: plugin.value.name }),
        description: t('plugin:delete-configuration-info'),
        confirmLabel: t('action:delete-configuration'),
      },
      events: {
        // attached, so that a failure is displayed in the form instead of being only logged
        onConfirm: async () => {
          if (await runAction(run)) {
            onSuccess()
          }
        },
      },
    })
  }

  return { deleteConfiguration, canDeleteConfiguration, isDeletingConfiguration, deleteConfigurationErrorMessage }
}
