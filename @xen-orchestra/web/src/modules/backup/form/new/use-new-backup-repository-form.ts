import type { XoBackupFormat } from '@/modules/backup/types/xo-backup.ts'
import type { BackupRepositoryType } from '@/modules/backup/utils/xo-backup-repository-url.util.ts'
import { useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import type { FrontXoProxy } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { required } from '@core/packages/form-validation'
import { defineFormSteps } from '@core/packages/validated-form'
import { useMultiStepValidatedForm } from '@xen-orchestra/web-core/packages/validated-form/use-multi-step-validated-form.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { requiredIf } from '@regle/rules'
import { withMessage } from '@regle/rules'
import { regex } from '@regle/rules'

type NewBackupRepositoryFormData = {
  general: {
    name: string
    type: BackupRepositoryType | undefined
    backupFormat: XoBackupFormat | undefined
    proxy: FrontXoProxy['id'] | undefined
    encrypted: boolean
    encryptionKey: string
  }
}

const ENCRYPTION_KEY_LENGTH = 32
const ENCRYPTION_KEY_REGEX = /^[0-9a-f]{32}$/i

export function useNewBackupRepositoryForm() {
  const { t } = useI18n()

  const { proxies } = useXoProxyCollection()

  const formData = defineFormSteps<NewBackupRepositoryFormData>({
    general: {
      name: '',
      type: undefined,
      backupFormat: undefined,
      proxy: undefined,
      encrypted: false,
      encryptionKey: '',
    },
  })

  const { useField, useFormSelect, useSelect, currentStep, next, back, validateAllSteps } = useMultiStepValidatedForm(
    formData,
    {
      general: {
        errors: {
          onSubmit: () => ({
            name: { required },
            type: { required },
            backupFormat: { required },
            encryptionKey: {
              requiredIf: requiredIf(() => formData.general.encrypted),
              regex: withMessage(regex(ENCRYPTION_KEY_REGEX), () =>
                t('encryption-key-invalid', { n: ENCRYPTION_KEY_LENGTH })
              ),
            },
          }),
        },
      },
    }
  )

  const typeOptions = computed(() => [
    { id: 'file', label: t('local'), value: 'file' },
    { id: 'nfs', label: t('nfs'), value: 'nfs' },
    { id: 'smb', label: t('smb'), value: 'smb' },
    { id: 's3', label: t('s3'), value: 's3' },
    { id: 'azure', label: t('azure'), value: 'azure' },
  ])

  const { id: typeSelectId } = useFormSelect('type', typeOptions, {
    required: true,
    option: { label: 'label', value: 'value' },
  })

  const backupFormatOptions = computed(() => [
    { id: 'block', label: t('block-based'), value: 'block' },
    { id: 'vhd', label: t('vhd-file'), value: 'vhd' },
  ])

  const { id: backupFormatSelectId } = useFormSelect('backupFormat', backupFormatOptions, {
    required: true,
    option: { label: 'label', value: 'value' },
  })

  const { id: proxySelectId } = useFormSelect('proxy', proxies, {
    searchable: true,
    emptyOption: { label: t('none'), value: undefined },
    option: { label: 'name', value: 'id' },
  })

  return {
    currentStep,
    next,
    back,
    validateAllSteps,
    nameInputBindings: useField('name', () => ({ label: t('name'), required: true })),
    typeSelectBindings: useSelect(typeSelectId, () => ({ label: t('type') })),
    backupFormatSelectBindings: useSelect(backupFormatSelectId, () => ({ label: t('backup-format') })),
    proxySelectBindings: useSelect(proxySelectId, () => ({ label: t('proxy') })),
    encryptedCheckboxBindings: useField('encrypted'),
    encryptionKeyInputBindings: useField('encryptionKey', () => ({ label: t('key') })),
  }
}
