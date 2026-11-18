import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import { computed, type ComputedRef, ref, watch, type WatchSource } from 'vue'
import { useI18n } from 'vue-i18n'

export function useCredentialsError(credentialSources: WatchSource[]) {
  const { t } = useI18n()

  const credentialsError = ref<InputWrapperMessage>()

  watch(credentialSources, () => {
    credentialsError.value = undefined
  })

  function showCredentialsError() {
    credentialsError.value = { content: t('invalid-username-or-password'), accent: 'danger' }
  }

  function withCredentialsError<TField extends { error: InputWrapperMessage | undefined }>(
    field: ComputedRef<TField>
  ): ComputedRef<TField> {
    return computed(() => ({ ...field.value, error: field.value.error ?? credentialsError.value }))
  }

  return { showCredentialsError, withCredentialsError }
}
