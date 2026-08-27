import type { BackupRepositoryDetailsPayload } from '@/modules/backup/types/new-backup-repository.type.ts'
import type { BackupRepositoryType } from '@/modules/backup/utils/xo-backup-repository-url.util.ts'
import { required } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { type MaybeRefOrGetter, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export type AzureBackupRepositoryDetailsForm = ReturnType<typeof useAzureBackupRepositoryDetailsForm>

const INITIAL_FORM_DATA = {
  hostName: '',
  useHttps: true,
  accountName: '',
  key: '',
  containerName: '',
  pathInContainer: '',
}

export function useAzureBackupRepositoryDetailsForm(rawType: MaybeRefOrGetter<BackupRepositoryType | undefined>) {
  const { t } = useI18n()

  const type = toComputed(rawType)

  const formData = reactive({ ...INITIAL_FORM_DATA })

  const {
    useField,
    validate,
    reset: resetValidation,
  } = useValidatedForm(formData, {
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
    useHttps: useField('useHttps', () => ({ label: t('use-https') })),
    accountName: useField('accountName', () => ({ label: t('account-name'), required: true })),
    key: useField('key', () => ({ label: t('key'), required: true, type: 'password' })),
    containerName: useField('containerName', () => ({ label: t('container-name'), required: true })),
    pathInContainer: useField('pathInContainer', () => ({ label: t('path-in-container') })),
  })

  function buildPayload(): BackupRepositoryDetailsPayload {
    return {
      urlInfo: {
        type: type.value === 'azurite' ? 'azurite' : 'azure',
        protocol: formData.useHttps ? 'https' : 'http',
        host: formData.hostName,
        path: `${formData.containerName}/${formData.pathInContainer}`,
        username: formData.accountName,
        password: formData.key,
      },
    }
  }

  function reset() {
    Object.assign(formData, INITIAL_FORM_DATA)
    resetValidation()
  }

  return { formData, bindings, validate, buildPayload, reset }
}
