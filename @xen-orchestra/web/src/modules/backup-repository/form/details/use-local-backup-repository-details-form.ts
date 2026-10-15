import { useBackupRepositoryDetailsForm } from '@/modules/backup-repository/form/details/use-backup-repository-details-form.ts'
import type { BackupRepositoryDetailsPayload } from '@/modules/backup-repository/types/new-backup-repository.type.ts'
import type { FrontXoProxy } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { required } from '@core/packages/form-validation'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { type MaybeRefOrGetter, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export type LocalBackupRepositoryDetailsForm = ReturnType<typeof useLocalBackupRepositoryDetailsForm>

const INITIAL_FORM_DATA = {
  path: '',
}

export function useLocalBackupRepositoryDetailsForm(rawProxy: MaybeRefOrGetter<FrontXoProxy['id'] | undefined>) {
  const proxy = toComputed(rawProxy)
  const { t } = useI18n()

  const { formData, useField, validate, reset } = useBackupRepositoryDetailsForm(INITIAL_FORM_DATA, {
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

  return { formData, bindings, validate, buildPayload, reset }
}
