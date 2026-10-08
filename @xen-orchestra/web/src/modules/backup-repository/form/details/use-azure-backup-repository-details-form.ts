import { useBackupRepositoryDetailsForm } from '@/modules/backup-repository/form/details/use-backup-repository-details-form.ts'
import type { BackupRepositoryDetailsPayload } from '@/modules/backup-repository/types/new-backup-repository.type.ts'
import { required } from '@core/packages/form-validation'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { type MaybeRefOrGetter, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import type { BackupRepositoryType } from 'xo-remote-parser'

export type AzureBackupRepositoryDetailsForm = ReturnType<typeof useAzureBackupRepositoryDetailsForm>

const INITIAL_FORM_DATA = {
  hostName: '',
  useHttps: true,
  accountName: '',
  key: '',
  containerName: '',
  pathInContainer: '',
}

export type AzureBackupRepositoryDetailsFormData = typeof INITIAL_FORM_DATA

export function useAzureBackupRepositoryDetailsForm(
  rawType: MaybeRefOrGetter<BackupRepositoryType | undefined>,
  initialData?: Partial<AzureBackupRepositoryDetailsFormData>,
  mixedFields: (keyof AzureBackupRepositoryDetailsFormData)[] = []
) {
  const { t } = useI18n()

  const type = toComputed(rawType)

  const { formData, useField, validate, reset, getMixedPlaceholder } = useBackupRepositoryDetailsForm(
    { ...INITIAL_FORM_DATA, ...initialData },
    {
      errors: {
        onSubmit: () => ({
          hostName: { required },
          accountName: { required },
          key: { required },
          containerName: { required },
        }),
      },
    },
    mixedFields
  )

  const bindings = reactive({
    hostName: useField('hostName', () => ({
      label: t('host-name'),
      required: true,
      placeholder: getMixedPlaceholder('hostName'),
    })),
    useHttps: useField('useHttps', () => ({ label: t('use-https') })),
    accountName: useField('accountName', () => ({
      label: t('account-name'),
      required: true,
      placeholder: getMixedPlaceholder('accountName'),
    })),
    key: useField('key', () => ({
      label: t('key'),
      required: true,
      type: 'password' as const,
      placeholder: getMixedPlaceholder('key'),
    })),
    containerName: useField('containerName', () => ({
      label: t('container-name'),
      required: true,
      placeholder: getMixedPlaceholder('containerName'),
    })),
    pathInContainer: useField('pathInContainer', () => ({
      label: t('path-in-container'),
      placeholder: getMixedPlaceholder('pathInContainer'),
    })),
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

  return { formData, bindings, validate, buildPayload, reset }
}
