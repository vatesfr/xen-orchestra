import { useXoPluginConfigurationDelete } from '@/modules/plugin/composables/use-xo-plugin-configuration-delete.composable.ts'
import { useXoPluginConfigurationPresets } from '@/modules/plugin/composables/use-xo-plugin-configuration-presets.composable.ts'
import { useXoPluginConfigureJob } from '@/modules/plugin/jobs/xo-plugin-configure.job.ts'
import { getSchemaDefaults } from '@/modules/plugin/json-schema-form/json-schema.util.ts'
import { useJsonSchemaForm } from '@/modules/plugin/json-schema-form/use-json-schema-form.composable.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { useActionError } from '@/shared/composables/action-error.composable.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter, ref, watch } from 'vue'

export function useXoPluginConfiguration(rawPlugin: MaybeRefOrGetter<FrontXoPlugin>) {
  const plugin = toComputed(rawPlugin)

  const { error, clearError, runAction } = useActionError()

  const schema = computed(() => plugin.value.configurationSchema)

  // `undefined` means the form displays the saved configuration (or the schema defaults if it was never configured)
  const editedConfiguration = ref<unknown>()

  // displayed once saved, until the plugin update is received
  const sentConfiguration = ref<unknown>()

  watch(
    () => plugin.value.configuration,
    () => {
      sentConfiguration.value = undefined
    }
  )

  const isSaved = ref(false)

  const isDirty = computed(() => editedConfiguration.value !== undefined)

  const savedConfiguration = computed(() => sentConfiguration.value ?? plugin.value.configuration)

  const displayedConfiguration = computed(() => savedConfiguration.value ?? getSchemaDefaults(schema.value))

  const formValue = computed<unknown>({
    get: () => editedConfiguration.value ?? displayedConfiguration.value,
    set: value => {
      isSaved.value = false
      editedConfiguration.value = value ?? {}
    },
  })

  const { summaryErrors, submit: submitForm, reset: resetValidation } = useJsonSchemaForm(schema, formValue)

  function reset() {
    clearError()
    resetValidation()
    sentConfiguration.value = undefined
    editedConfiguration.value = undefined
  }

  const { presetNames, presetSelectId, canApplyPreset, applyPreset } = useXoPluginConfigurationPresets(
    plugin,
    formValue
  )

  const {
    run: configure,
    canRun: canConfigure,
    isRunning: isSaving,
    errorMessage: saveErrorMessage,
  } = useXoPluginConfigureJob(plugin, formValue)

  async function save() {
    isSaved.value = false

    if (!submitForm() || !(await runAction(configure))) {
      return
    }

    resetValidation()
    sentConfiguration.value = formValue.value
    editedConfiguration.value = undefined
    isSaved.value = true
  }

  const {
    deleteConfiguration,
    canDeleteConfiguration: canRunDeleteConfiguration,
    isDeletingConfiguration,
    deleteConfigurationErrorMessage,
  } = useXoPluginConfigurationDelete(plugin, {
    runAction: action => {
      isSaved.value = false

      return runAction(action)
    },
    onSuccess: reset,
  })

  // saving and deleting the configuration must not run at the same time
  const canSave = computed(
    () =>
      canConfigure.value && !isDeletingConfiguration.value && (isDirty.value || savedConfiguration.value === undefined)
  )

  const canDeleteConfiguration = computed(() => canRunDeleteConfiguration.value && !isSaving.value)

  const isBusy = computed(() => isSaving.value || isDeletingConfiguration.value)

  return {
    schema,
    formValue,
    isDirty,
    isBusy,
    isSaved,
    error,
    summaryErrors,
    reset,
    presetNames,
    presetSelectId,
    canApplyPreset,
    applyPreset,
    save,
    canSave,
    isSaving,
    saveErrorMessage,
    deleteConfiguration,
    canDeleteConfiguration,
    isDeletingConfiguration,
    deleteConfigurationErrorMessage,
  }
}
