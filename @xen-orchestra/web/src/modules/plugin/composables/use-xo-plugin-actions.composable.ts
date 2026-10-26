import { useXoPluginConfigurationDelete } from '@/modules/plugin/composables/use-xo-plugin-configuration-delete.composable.ts'
import { useXoPluginConfigure } from '@/modules/plugin/composables/use-xo-plugin-configure.composable.ts'
import { useXoPluginTest } from '@/modules/plugin/composables/use-xo-plugin-test.composable.ts'
import { useXoPluginAutoloadJob } from '@/modules/plugin/jobs/xo-plugin-autoload.job.ts'
import { useXoPluginChangeStateJob } from '@/modules/plugin/jobs/xo-plugin-change-state.job.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { isPluginLoaded } from '@/modules/plugin/utils/xo-plugin.util.ts'
import type { LeafActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useXoPluginActions(rawPlugin: MaybeRefOrGetter<FrontXoPlugin>) {
  const plugin = toComputed(rawPlugin)

  const { t } = useI18n()

  const isLoaded = computed(() => isPluginLoaded(plugin.value))

  const {
    run: changeState,
    canRun: canChangeState,
    isRunning: isChangingState,
    errorMessage: changeStateErrorMessage,
  } = useXoPluginChangeStateJob(plugin, () => !isLoaded.value)

  const {
    run: updateAutoload,
    canRun: canUpdateAutoload,
    isRunning: isUpdatingAutoload,
    errorMessage: updateAutoloadErrorMessage,
  } = useXoPluginAutoloadJob(plugin, () => !plugin.value.autoload)

  // changing the state also updates the autoload, so both actions must not run at the same time
  const loadAction = computed(
    (): LeafActionItem => ({
      label: isLoaded.value ? t('action:unload') : t('action:load'),
      icon: isLoaded.value ? 'action:disconnect' : 'action:connect',
      onClick: () => changeState(),
      disabled: !canChangeState.value || isUpdatingAutoload.value,
      busy: isChangingState.value,
      hint: changeStateErrorMessage.value,
    })
  )

  const autoloadAction = computed(
    (): LeafActionItem => ({
      label: plugin.value.autoload ? t('action:disable-load-at-startup') : t('action:enable-load-at-startup'),
      icon: 'action:change-state',
      onClick: () => updateAutoload(),
      disabled: !canUpdateAutoload.value || isChangingState.value,
      busy: isUpdatingAutoload.value,
      hint: updateAutoloadErrorMessage.value,
    })
  )

  const { configurePlugin, canConfigurePlugin, isConfiguringPlugin, configurePluginErrorMessage } =
    useXoPluginConfigure(plugin)

  const { testPlugin, canTestPlugin, isTestingPlugin, testPluginErrorMessage } = useXoPluginTest(plugin)

  const { deleteConfiguration, canDeleteConfiguration, isDeletingConfiguration, deleteConfigurationErrorMessage } =
    useXoPluginConfigurationDelete(plugin)

  // saving and deleting the configuration must not run at the same time
  const configureAction = computed(
    (): LeafActionItem => ({
      label: t('action:configure'),
      icon: 'action:edit',
      onClick: () => configurePlugin(),
      disabled: !canConfigurePlugin.value || isDeletingConfiguration.value,
      busy: isConfiguringPlugin.value,
      hint: configurePluginErrorMessage.value,
    })
  )

  const testAction = computed(
    (): LeafActionItem => ({
      label: t('action:test-plugin'),
      icon: 'action:scan',
      onClick: () => testPlugin(),
      disabled: !canTestPlugin.value,
      busy: isTestingPlugin.value,
      hint: testPluginErrorMessage.value,
    })
  )

  const deleteConfigurationAction = computed(
    (): LeafActionItem => ({
      label: t('action:delete-configuration'),
      icon: 'action:delete',
      accent: 'danger',
      separator: true,
      onClick: () => deleteConfiguration(),
      disabled: !canDeleteConfiguration.value || isConfiguringPlugin.value,
      busy: isDeletingConfiguration.value,
      hint: deleteConfigurationErrorMessage.value,
    })
  )

  const moreActions = computed(() => [autoloadAction.value, testAction.value, deleteConfigurationAction.value])

  return { loadAction, autoloadAction, configureAction, testAction, deleteConfigurationAction, moreActions }
}
