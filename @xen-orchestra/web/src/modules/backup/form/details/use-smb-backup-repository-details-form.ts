import type { BackupRepositoryDetailsPayload } from '@/modules/backup/types/new-backup-repository.type.ts'
import type { InputType } from '@core/components/ui/input/UiInput.vue'
import { required } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export const SMB_DEFAULT_DOMAIN = 'WORKGROUP'

export type SmbBackupRepositoryDetailsForm = ReturnType<typeof useSmbBackupRepositoryDetailsForm>

const INITIAL_FORM_DATA = {
  pathOnShare: '',
  subfolder: '',
  username: '',
  password: '',
  domain: '',
  customOptions: '',
}

export function useSmbBackupRepositoryDetailsForm() {
  const { t } = useI18n()

  const formData = reactive({ ...INITIAL_FORM_DATA })

  const {
    useField,
    validate,
    reset: resetValidation,
  } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        pathOnShare: { required },
        username: { required },
        password: { required },
      }),
    },
  })

  const bindings = reactive({
    pathOnShare: useField('pathOnShare', () => ({
      label: t('path-on-share'),
      required: true,
      prefix: '\\\\',
      info: t('smb-share-sample'),
    })),
    subfolder: useField('subfolder', () => ({
      label: t('subfolder'),
      prefix: '\\',
      info: t('smb-subfolder-sample'),
    })),
    username: useField('username', () => ({ label: t('username'), required: true })),
    password: useField('password', () => ({ label: t('password'), required: true, type: 'password' as InputType })),
    domain: useField('domain', () => ({
      label: t('domain'),
      placeholder: SMB_DEFAULT_DOMAIN,
      info: t('value-by-default', { value: SMB_DEFAULT_DOMAIN }),
    })),
    customOptions: useField('customOptions', () => ({ label: t('custom-options') })),
  })

  function buildPayload(): BackupRepositoryDetailsPayload {
    return {
      urlInfo: {
        type: 'smb',
        host: formData.pathOnShare,
        path: formData.subfolder,
        domain: formData.domain !== '' ? formData.domain : SMB_DEFAULT_DOMAIN,
        username: formData.username,
        password: formData.password,
      },
      ...(formData.customOptions !== '' && { options: formData.customOptions }),
    }
  }

  function reset() {
    Object.assign(formData, INITIAL_FORM_DATA)
    resetValidation()
  }

  return { formData, bindings, validate, buildPayload, reset }
}
