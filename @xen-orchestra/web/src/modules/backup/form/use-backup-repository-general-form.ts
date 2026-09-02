import type { XoBackupFormat } from '@/modules/backup/types/xo-backup.ts'
import type {
  BackupRepositoryOptions,
  BackupRepositoryType,
} from '@/modules/backup/utils/xo-backup-repository-url.util.ts'
import { type FrontXoProxy, useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { regex, required, requiredIf, withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

type BackupRepositoryGeneralFormData = {
  name: string
  type: BackupRepositoryType | undefined
  backupFormat: XoBackupFormat | undefined
  proxy: FrontXoProxy['id'] | undefined
  encrypted: boolean
  encryptionKey: string
}

const ENCRYPTION_KEY_LENGTH = 32
const ENCRYPTION_KEY_REGEX = /^[0-9a-f]{32}$/i

const BACKUP_FORMAT_DOC_URL = 'https://docs.xen-orchestra.com/xo5/incremental_backups'

const BLOCK_ONLY_TYPES: BackupRepositoryType[] = ['azure', 'azurite', 's3']

export type BackupRepositoryGeneralForm = ReturnType<typeof useBackupRepositoryGeneralForm>

export function useBackupRepositoryGeneralForm() {
  const { t } = useI18n()

  const { proxies } = useXoProxyCollection()

  const formData = reactive<BackupRepositoryGeneralFormData>({
    name: '',
    type: undefined,
    backupFormat: undefined,
    proxy: undefined,
    encrypted: false,
    encryptionKey: '',
  })

  const { useField, useFormSelect, useSelect, validate } = useValidatedForm(formData, {
    errors: {
      onBlur: () => ({
        encryptionKey: {
          regex: withMessage(regex(ENCRYPTION_KEY_REGEX), () =>
            t('encryption-key-invalid', { n: ENCRYPTION_KEY_LENGTH })
          ),
        },
      }),
      onSubmit: () => ({
        name: { required },
        type: { required },
        backupFormat: { required },
        encryptionKey: {
          requiredIf: requiredIf(() => formData.encrypted),
        },
      }),
    },
  })

  const isBackupFormatLocked = computed(() => formData.type !== undefined && BLOCK_ONLY_TYPES.includes(formData.type))

  const isEncryptionAvailable = computed(() => formData.backupFormat === 'block')

  watch(isBackupFormatLocked, isLocked => {
    formData.backupFormat = isLocked ? 'block' : undefined
  })

  watch(isEncryptionAvailable, isAvailable => {
    if (!isAvailable) {
      formData.encrypted = false
    }
  })

  watch(
    () => formData.encrypted,
    encrypted => {
      if (!encrypted) {
        formData.encryptionKey = ''
      }
    }
  )

  const typeOptions = computed(() => [
    { id: 'file', label: t('local'), value: 'file' },
    { id: 'nfs', label: t('nfs'), value: 'nfs' },
    { id: 'smb', label: t('smb'), value: 'smb' },
    { id: 's3', label: t('s3'), value: 's3' },
    { id: 'azure', label: t('azure'), value: 'azure' },
    { id: 'azurite', label: t('azurite'), value: 'azurite' },
  ])

  const { id: typeSelectId } = useFormSelect('type', typeOptions, {
    required: true,
    option: { label: 'label', value: 'value' },
  })

  const backupFormatOptions = computed(() => [
    { id: 'block', label: t('block-based'), value: 'block', hint: t('block-based-hint') },
    { id: 'vhd', label: t('vhd-file'), value: 'vhd', hint: t('vhd-file-hint') },
  ])

  const { id: backupFormatSelectId } = useFormSelect('backupFormat', backupFormatOptions, {
    required: true,
    disabled: () => formData.type === undefined || isBackupFormatLocked.value,
    option: { label: 'label', value: 'value', properties: source => ({ hint: source.hint }) },
  })

  const { id: proxySelectId } = useFormSelect('proxy', proxies, {
    searchable: true,
    emptyOption: { label: t('none'), value: undefined },
    option: { label: 'name', value: 'id' },
  })

  const bindings = reactive({
    name: useField('name', () => ({ label: t('name'), required: true })),
    type: useSelect(typeSelectId, () => ({ label: t('type') })),
    backupFormat: useSelect(backupFormatSelectId, () => ({
      label: t('backup-format'),
      learnMoreUrl: BACKUP_FORMAT_DOC_URL,
    })),
    proxy: useSelect(proxySelectId, () => ({ label: t('proxy') })),
    encrypted: useField('encrypted', () => ({
      label: t('encrypted'),
      warning: t('encryption-key-loss-warning'),
      disabled: !isEncryptionAvailable.value,
    })),
    encryptionKey: useField('encryptionKey', () => ({
      label: t('key'),
      required: true,
      info: t('n-hexadecimal-characters', { n: ENCRYPTION_KEY_LENGTH }),
    })),
  })

  function buildUrlOptions(): BackupRepositoryOptions {
    return {
      ...(formData.encrypted && formData.encryptionKey !== '' && { encryptionKey: formData.encryptionKey }),
      ...(formData.backupFormat === 'block' && { useVhdDirectory: true }),
    }
  }

  return { formData, bindings, validate, buildUrlOptions }
}
