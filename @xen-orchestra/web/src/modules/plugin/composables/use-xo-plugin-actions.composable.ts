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
      hint: canChangeState.value ? undefined : changeStateErrorMessage.value,
    })
  )

  const autoloadAction = computed(
    (): LeafActionItem => ({
      label: plugin.value.autoload ? t('action:disable-load-at-startup') : t('action:enable-load-at-startup'),
      icon: 'action:change-state',
      onClick: () => updateAutoload(),
      disabled: !canUpdateAutoload.value || isChangingState.value,
      busy: isUpdatingAutoload.value,
      hint: canUpdateAutoload.value ? undefined : updateAutoloadErrorMessage.value,
    })
  )

  return { loadAction, autoloadAction }
}
