import { required } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export type AzureBackupRepositoryDetailsForm = ReturnType<typeof useAzureBackupRepositoryDetailsForm>

export function useAzureBackupRepositoryDetailsForm() {
  const { t } = useI18n()

  const formData = reactive({
    hostName: '',
    accountName: '',
    key: '',
    containerName: '',
    pathInContainer: '',
  })

  const { useField, validate } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        hostName: { required },
        accountName: { required },
        key: { required },
        containerName: { required },
      }),
    },
  })

  const bindings = reactive({
    hostName: useField('hostName', () => ({ label: t('host-name'), required: true })),
    accountName: useField('accountName', () => ({ label: t('account-name'), required: true })),
    key: useField('key', () => ({ label: t('key'), required: true })),
    containerName: useField('containerName', () => ({ label: t('container-name'), required: true })),
    pathInContainer: useField('pathInContainer', () => ({ label: t('path-in-container') })),
  })

  return { bindings, validate }
}
