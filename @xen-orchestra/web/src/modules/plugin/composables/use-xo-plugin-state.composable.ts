import { useXoPluginAutoloadJob } from '@/modules/plugin/jobs/xo-plugin-autoload.job.ts'
import { useXoPluginLoadJob } from '@/modules/plugin/jobs/xo-plugin-load.job.ts'
import { useXoPluginUnloadJob } from '@/modules/plugin/jobs/xo-plugin-unload.job.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { useActionError } from '@/shared/composables/action-error.composable.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'

export function useXoPluginState(rawPlugin: MaybeRefOrGetter<FrontXoPlugin>) {
  const plugin = toComputed(rawPlugin)

  const { error, runAction } = useActionError()

  const {
    run: load,
    canRun: canLoad,
    isRunning: isLoading,
    errorMessage: loadErrorMessage,
  } = useXoPluginLoadJob(plugin)

  const {
    run: unload,
    canRun: canUnload,
    isRunning: isUnloading,
    errorMessage: unloadErrorMessage,
  } = useXoPluginUnloadJob(plugin)

  const {
    run: updateAutoload,
    canRun: canUpdateAutoload,
    isRunning: isTogglingAutoload,
    errorMessage: toggleAutoloadErrorMessage,
  } = useXoPluginAutoloadJob(plugin, () => !plugin.value.autoload)

  const isLoaded = computed(() => plugin.value.loaded === true)

  const isTogglingLoaded = computed(() => isLoading.value || isUnloading.value)

  // loading and unloading also update the autoload, so the toggles must not run at the same time
  const canToggleLoaded = computed(
    () => (isLoaded.value ? canUnload.value : canLoad.value) && !isTogglingAutoload.value
  )

  const canToggleAutoload = computed(() => canUpdateAutoload.value && !isTogglingLoaded.value)

  const toggleLoadedErrorMessage = computed(() => (isLoaded.value ? unloadErrorMessage.value : loadErrorMessage.value))

  function toggleLoaded() {
    return runAction(isLoaded.value ? unload : load)
  }

  function toggleAutoload() {
    return runAction(updateAutoload)
  }

  return {
    isLoaded,
    toggleLoaded,
    canToggleLoaded,
    isTogglingLoaded,
    toggleLoadedErrorMessage,
    toggleAutoload,
    canToggleAutoload,
    isTogglingAutoload,
    toggleAutoloadErrorMessage,
    error,
  }
}
