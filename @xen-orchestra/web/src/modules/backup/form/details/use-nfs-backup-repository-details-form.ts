import type { BackupRepositoryDetailsPayload } from '@/modules/backup/types/new-backup-repository.type.ts'
import { required } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export const NFS_DEFAULT_PORT = '2049'

export type NfsBackupRepositoryDetailsForm = ReturnType<typeof useNfsBackupRepositoryDetailsForm>

const INITIAL_FORM_DATA = {
  host: '',
  port: '',
  path: '',
  customOptions: '',
}

export function useNfsBackupRepositoryDetailsForm() {
  const { t } = useI18n()

  const formData = reactive({ ...INITIAL_FORM_DATA })

  const {
    useField,
    validate,
    reset: resetValidation,
  } = useValidatedForm(formData, {
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

  function buildPayload(): BackupRepositoryDetailsPayload {
    return {
      urlInfo: {
        type: 'nfs',
        host: formData.host,
        port: formData.port !== '' ? formData.port : NFS_DEFAULT_PORT,
        path: formData.path,
      },
      ...(formData.customOptions !== '' && { options: formData.customOptions }),
    }
  }

  function reset() {
    Object.assign(formData, INITIAL_FORM_DATA)
    resetValidation()
  }

  function hydrate()

  return { formData, bindings, validate, buildPayload, reset }
}
