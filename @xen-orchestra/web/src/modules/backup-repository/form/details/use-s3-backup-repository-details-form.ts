import { useBackupRepositoryDetailsForm } from '@/modules/backup-repository/form/details/use-backup-repository-details-form.ts'
import type { BackupRepositoryDetailsPayload } from '@/modules/backup-repository/types/new-backup-repository.type.ts'
import { required } from '@core/packages/form-validation'
import { reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

export type S3BackupRepositoryDetailsForm = ReturnType<typeof useS3BackupRepositoryDetailsForm>

const INITIAL_FORM_DATA = {
  endpoint: '',
  useHttps: false,
  allowUnauthorized: false,
  region: '',
  accessKeyId: '',
  secret: '',
  bucket: '',
  pathInBucket: '',
}

export type S3BackupRepositoryDetailsFormData = typeof INITIAL_FORM_DATA

export function useS3BackupRepositoryDetailsForm(initialData?: Partial<S3BackupRepositoryDetailsFormData>) {
  const { t } = useI18n()

  const { formData, useField, validate, reset } = useBackupRepositoryDetailsForm({ ...INITIAL_FORM_DATA, ...initialData }, {
    errors: {
      onSubmit: () => ({
        endpoint: { required },
        region: { required },
        accessKeyId: { required },
        secret: { required },
        bucket: { required },
      }),
    },
  })

  watch(
    () => formData.useHttps,
    useHttps => {
      if (!useHttps) {
        formData.allowUnauthorized = false
      }
    }
  )

  const bindings = reactive({
    endpoint: useField('endpoint', () => ({
      label: t('endpoint-url'),
      required: true,
      info: t('s3-endpoint-sample'),
    })),
    useHttps: useField('useHttps', () => ({ label: t('use-https') })),
    allowUnauthorized: useField('allowUnauthorized', () => ({ label: t('allow-unauthorized') })),
    region: useField('region', () => ({ label: t('region'), required: true })),
    accessKeyId: useField('accessKeyId', () => ({ label: t('access-key-id'), required: true })),
    secret: useField('secret', () => ({ label: t('secret'), required: true, type: 'password' as const })),
    bucket: useField('bucket', () => ({ label: t('bucket-name'), required: true })),
    pathInBucket: useField('pathInBucket', () => ({ label: t('path-in-bucket') })),
  })

  function buildPayload(): BackupRepositoryDetailsPayload {
    return {
      urlInfo: {
        type: 's3',
        protocol: formData.useHttps ? 'https' : 'http',
        host: formData.endpoint,
        path: `${formData.bucket}/${formData.pathInBucket}`,
        region: formData.region,
        username: formData.accessKeyId,
        password: formData.secret,
        ...(formData.allowUnauthorized && { allowUnauthorized: true }),
      },
    }
  }

  return { formData, bindings, validate, buildPayload, reset }
}
