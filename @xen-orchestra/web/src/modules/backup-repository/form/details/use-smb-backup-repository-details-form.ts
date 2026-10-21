import { useBackupRepositoryDetailsForm } from '@/modules/backup-repository/form/details/use-backup-repository-details-form.ts'
import type { BackupRepositoryDetailsPayload } from '@/modules/backup-repository/types/new-backup-repository.type.ts'
import {
  buildSmbBackupRepositoryDetailsPayload,
  SMB_DEFAULT_DOMAIN,
} from '@/modules/backup-repository/utils/xo-backup-repository-details-payload.util.ts'
import { required } from '@core/packages/form-validation'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

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

export function useSmbBackupRepositoryDetailsForm(initialData?: Partial<SmbBackupRepositoryDetailsFormData>) {
  const { t } = useI18n()

  const { formData, useField, validate, reset } = useBackupRepositoryDetailsForm(
    { ...INITIAL_FORM_DATA, ...initialData },
    {
      errors: {
        onSubmit: () => ({
          pathOnShare: { required },
          username: { required },
          password: { required },
        }),
      },
    }
  )

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
    password: useField('password', () => ({ label: t('password'), required: true, type: 'password' as const })),
    domain: useField('domain', () => ({
      label: t('domain'),
      placeholder: SMB_DEFAULT_DOMAIN,
      info: t('value-by-default', { value: SMB_DEFAULT_DOMAIN }),
    })),
    customOptions: useField('customOptions', () => ({ label: t('custom-options') })),
  })

  function buildPayload(): BackupRepositoryDetailsPayload {
    return buildSmbBackupRepositoryDetailsPayload(formData)
  }

  return { formData, bindings, validate, buildPayload, reset }
}
