import type { BackupRepositoryDetailsPayload } from '@/modules/backup/types/new-backup-repository-type.type.ts'
import type { FrontXoProxy } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { required } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { type MaybeRefOrGetter, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export type LocalBackupRepositoryDetailsForm = ReturnType<typeof useLocalBackupRepositoryDetailsForm>

export function useLocalBackupRepositoryDetailsForm(rawProxy: MaybeRefOrGetter<FrontXoProxy['id'] | undefined>) {
  const proxy = toComputed(rawProxy)
  const { t } = useI18n()

  const formData = reactive({
    path: '',
  })

  const { useField, validate } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        path: { required },
      }),
    },
  })

  const bindings = reactive({
    path: useField('path', () => ({
      label: t('backup-repository-path'),
      required: true,
      info: proxy.value ? t('path-must-be-absolute-on-proxy-host') : undefined,
    })),
  })

  function buildPayload(): BackupRepositoryDetailsPayload {
    return {
      urlInfo: {
        type: 'file',
        path: formData.path,
      },
    }
  }

  return { formData, bindings, validate, buildPayload }
}
