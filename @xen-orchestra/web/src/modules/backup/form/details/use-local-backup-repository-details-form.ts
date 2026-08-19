import type { FrontXoProxy } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { required } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { type MaybeRefOrGetter, reactive, toValue } from 'vue'
import { useI18n } from 'vue-i18n'

export type LocalBackupRepositoryDetailsForm = ReturnType<typeof useLocalBackupRepositoryDetailsForm>

export function useLocalBackupRepositoryDetailsForm(_proxy: MaybeRefOrGetter<FrontXoProxy['id'] | undefined>) {
  const { t } = useI18n()

  const formData = reactive({
    path: '',
  })

  const { useField, validate } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        path: { required },
      }),
    },
  })

  const bindings = reactive({
    path: useField('path', () => ({
      label: t('backup-repository-path'),
      required: true,
      info: toValue(_proxy) !== undefined ? t('path-must-be-absolute-on-proxy-host') : undefined,
    })),
  })

  return { bindings, validate }
}
