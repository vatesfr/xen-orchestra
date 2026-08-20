import type { BackupRepositoryDetailsPayload } from '@/modules/backup/types/new-backup-repository.type.ts'
import { required } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

export type S3BackupRepositoryDetailsForm = ReturnType<typeof useS3BackupRepositoryDetailsForm>

export function useS3BackupRepositoryDetailsForm() {
  const { t } = useI18n()

  const formData = reactive({
    endpoint: '',
    useHttps: false,
    allowUnauthorized: false,
    region: '',
    accessKeyId: '',
    secret: '',
    bucket: '',
    pathInBucket: '',
  })

  const { useField, validate } = useValidatedForm(formData, {
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
    secret: useField('secret', () => ({ label: t('secret'), required: true })),
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

  return { formData, bindings, validate, buildPayload }
}
