import { defineFormSteps } from '@core/packages/validated-form'
import { boolean } from '@regle/rules'
import { useI18n } from 'vue-i18n'

export function useNewBackupRepositoryForm() {
  const { t } = useI18n()

  const formData = defineFormSteps({
    general: {
      name: '',
      type: undefined,
      backupFormat: undefined,
      proxy: undefined,
      encrypted: boolean,
      encryptionKey: '',
    },
  })

  return {}
}
