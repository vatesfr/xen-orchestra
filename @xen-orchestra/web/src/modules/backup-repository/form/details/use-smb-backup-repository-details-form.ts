import { useBackupRepositoryDetailsForm } from '@/modules/backup-repository/form/details/use-backup-repository-details-form.ts'
import type { BackupRepositoryDetailsPayload } from '@/modules/backup-repository/types/new-backup-repository.type.ts'
import { required } from '@core/packages/form-validation'
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

export type SmbBackupRepositoryDetailsFormData = typeof INITIAL_FORM_DATA

export function useSmbBackupRepositoryDetailsForm(
  initialData?: Partial<SmbBackupRepositoryDetailsFormData>,
  mixedFields: (keyof SmbBackupRepositoryDetailsFormData)[] = []
) {
  const { t } = useI18n()

  const { formData, useField, validate, reset, getMixedPlaceholder } = useBackupRepositoryDetailsForm(
    { ...INITIAL_FORM_DATA, ...initialData },
    {
      errors: {
        onSubmit: () => ({
          pathOnShare: { required },
          username: { required },
          password: { required },
        }),
      },
    },
    mixedFields
  )

  const bindings = reactive({
    pathOnShare: useField('pathOnShare', () => ({
      label: t('path-on-share'),
      required: true,
      prefix: '\\\\',
      info: t('smb-share-sample'),
      placeholder: getMixedPlaceholder('pathOnShare'),
    })),
    subfolder: useField('subfolder', () => ({
      label: t('subfolder'),
      prefix: '\\',
      info: t('smb-subfolder-sample'),
      placeholder: getMixedPlaceholder('subfolder'),
    })),
    username: useField('username', () => ({
      label: t('username'),
      required: true,
      placeholder: getMixedPlaceholder('username'),
    })),
    password: useField('password', () => ({
      label: t('password'),
      required: true,
      type: 'password' as const,
      placeholder: getMixedPlaceholder('password'),
    })),
    domain: useField('domain', () => ({
      label: t('domain'),
      placeholder: getMixedPlaceholder('domain', SMB_DEFAULT_DOMAIN),
      info: t('value-by-default', { value: SMB_DEFAULT_DOMAIN }),
    })),
    customOptions: useField('customOptions', () => ({
      label: t('custom-options'),
      placeholder: getMixedPlaceholder('customOptions'),
    })),
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

  return { formData, bindings, validate, buildPayload, reset }
}
