import type { BackupRepositoryDetailsPayload } from '@/modules/backup/types/new-backup-repository.type.ts'
import type { InputType } from '@core/components/ui/input/UiInput.vue'
import { required } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
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

export function useS3BackupRepositoryDetailsForm() {
  const { t } = useI18n()

  const formData = reactive({ ...INITIAL_FORM_DATA })

  const {
    useField,
    validate,
    reset: resetValidation,
  } = useValidatedForm(formData, {
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
    secret: useField('secret', () => ({ label: t('secret'), required: true, type: 'password' as InputType })),
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

  function reset() {
    Object.assign(formData, INITIAL_FORM_DATA)
    resetValidation()
  }

  return { formData, bindings, validate, buildPayload, reset }
}
