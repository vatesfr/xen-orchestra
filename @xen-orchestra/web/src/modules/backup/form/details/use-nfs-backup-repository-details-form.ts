import { required } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export const NFS_DEFAULT_PORT = '2049'

export type NfsBackupRepositoryDetailsForm = ReturnType<typeof useNfsBackupRepositoryDetailsForm>

export function useNfsBackupRepositoryDetailsForm() {
  const { t } = useI18n()

  const formData = reactive({
    host: '',
    port: '',
    path: '',
    customOptions: '',
  })

  const { useField, validate } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        host: { required },
        path: { required },
      }),
    },
  })

  const bindings = reactive({
    host: useField('host', () => ({ label: t('host-or-ip-address'), required: true })),
    port: useField('port', () => ({
      label: t('port'),
      placeholder: NFS_DEFAULT_PORT,
      info: t('value-by-default', { value: NFS_DEFAULT_PORT }),
    })),
    path: useField('path', () => ({ label: t('path-on-share'), required: true })),
    customOptions: useField('customOptions', () => ({ label: t('custom-options') })),
  })

  return { formData, bindings, validate }
}
