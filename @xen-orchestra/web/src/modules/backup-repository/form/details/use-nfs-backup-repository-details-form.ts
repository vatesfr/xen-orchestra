import { useBackupRepositoryDetailsForm } from '@/modules/backup-repository/form/details/use-backup-repository-details-form.ts'
import type { BackupRepositoryDetailsPayload } from '@/modules/backup-repository/types/new-backup-repository.type.ts'
import {
  buildNfsBackupRepositoryDetailsPayload,
  NFS_DEFAULT_PORT,
} from '@/modules/backup-repository/utils/xo-backup-repository-details-payload.util.ts'
import { type Maybe, or, port, required, withMessage } from '@core/packages/form-validation'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export type NfsBackupRepositoryDetailsForm = ReturnType<typeof useNfsBackupRepositoryDetailsForm>

const INITIAL_FORM_DATA = {
  host: '',
  port: '',
  path: '',
  customOptions: '',
}

export type NfsBackupRepositoryDetailsFormData = typeof INITIAL_FORM_DATA

export function useNfsBackupRepositoryDetailsForm(initialData?: Partial<NfsBackupRepositoryDetailsFormData>) {
  const { t } = useI18n()

  const { formData, useField, validate, reset } = useBackupRepositoryDetailsForm(
    { ...INITIAL_FORM_DATA, ...initialData },
    {
      errors: {
        onBlur: () => ({
          // In multi-edition, the port can be the mixed value when it differs between the edited BRs
          port: {
            port: withMessage(
              or(port, (value: Maybe<string>) => value === t('mixed-value')),
              () => t('invalid-port')
            ),
          },
        }),
        onSubmit: () => ({
          host: { required },
          path: { required },
        }),
      },
    }
  )

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
    return buildNfsBackupRepositoryDetailsPayload(formData)
  }

  return { formData, bindings, validate, buildPayload, reset }
}
