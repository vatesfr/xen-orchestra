import type { XoBackupFormat } from '@/modules/backup/types/xo-backup.ts'
import { useXoBackupRepositoryCompressionLabels } from '@/modules/backup-repository/composables/use-xo-backup-repository-compression-label.composable.ts'
import { useXoBackupRepositoryTypeLabel } from '@/modules/backup-repository/composables/use-xo-backup-repository-type-label.composable.ts'
import {
  BACKUP_REPOSITORY_COMPRESSIONS,
  DEFAULT_BACKUP_REPOSITORY_COMPRESSION,
} from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import { type FrontXoProxy, useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { regex, required, requiredIf, withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import type { BACKUP_REPOSITORY_COMPRESSION } from '@vates/types'
import { computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { BACKUP_REPOSITORY_TYPE, type BackupRepositoryType, type BackupRepositoryUrlOptions } from 'xo-remote-parser'

type BackupRepositoryGeneralFormData = {
  name: string
  type: BackupRepositoryType | undefined
  backupFormat: XoBackupFormat | undefined
  proxy: FrontXoProxy['id'] | undefined
  encrypted: boolean
  encryptionKey: string
  compression: BACKUP_REPOSITORY_COMPRESSION
}

const ENCRYPTION_KEY_LENGTH = 32
const ENCRYPTION_KEY_REGEX = new RegExp(`^[0-9a-f]{${ENCRYPTION_KEY_LENGTH}}$`, 'i')

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
    compression: DEFAULT_BACKUP_REPOSITORY_COMPRESSION,
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

  const isBlockFormat = computed(() => formData.backupFormat === 'block')

  watch(isBackupFormatLocked, isLocked => {
    formData.backupFormat = isLocked ? 'block' : undefined
  })

  watch(isEncryptionAvailable, isAvailable => {
    if (!isAvailable) {
      formData.encrypted = false
    }
  })

  // the compression only applies to the block based format
  watch(isBlockFormat, isBlock => {
    if (!isBlock) {
      formData.compression = DEFAULT_BACKUP_REPOSITORY_COMPRESSION
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

  const typeOptions = Object.values(BACKUP_REPOSITORY_TYPE).map(type => ({
    id: type,
    label: useXoBackupRepositoryTypeLabel(type).value,
    value: type,
  }))

  const { id: typeSelectId } = useFormSelect('type', typeOptions, {
    required: true,
    option: { label: 'label', value: 'value' },
  })

  const backupFormatLabels = computed<Record<XoBackupFormat, string>>(() => ({
    block: t('block-based'),
    vhd: t('vhd-file'),
  }))

  function getBackupFormatLabel(format: XoBackupFormat | undefined): string | undefined {
    return format !== undefined ? backupFormatLabels.value[format] : undefined
  }

  const backupFormatOptions = computed(() => [
    { id: 'block', label: backupFormatLabels.value.block, value: 'block', hint: t('block-based-hint') },
    { id: 'vhd', label: backupFormatLabels.value.vhd, value: 'vhd', hint: t('vhd-file-hint') },
  ])

  const { id: backupFormatSelectId } = useFormSelect('backupFormat', backupFormatOptions, {
    required: true,
    disabled: () => formData.type === undefined || isBackupFormatLocked.value,
    option: { label: 'label', value: 'value', properties: source => ({ hint: source.hint }) },
  })

  const compressionLabels = useXoBackupRepositoryCompressionLabels()

  const compressionOptions = computed(() =>
    BACKUP_REPOSITORY_COMPRESSIONS.map(compression => ({
      id: compression,
      label: compressionLabels.value[compression],
      value: compression,
      hint: compression === 'zstd' ? t('zstd-node-requirement') : undefined,
    }))
  )

  const { id: compressionSelectId } = useFormSelect('compression', compressionOptions, {
    required: true,
    disabled: () => !isBlockFormat.value,
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
    compression: useSelect(compressionSelectId, () => ({ label: t('compression') })),
  })

  function buildUrlOptions(): BackupRepositoryUrlOptions {
    return {
      ...(formData.encrypted && { encryptionKey: formData.encryptionKey }),
      ...(formData.backupFormat === 'block' && { useVhdDirectory: true }),
      // no compressionType in the URL means the default compression
      ...(isBlockFormat.value &&
        formData.compression !== DEFAULT_BACKUP_REPOSITORY_COMPRESSION && { compressionType: formData.compression }),
    }
  }

  return { formData, bindings, validate, buildUrlOptions, getBackupFormatLabel }
}
