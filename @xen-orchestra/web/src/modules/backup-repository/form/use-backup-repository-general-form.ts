import type { XoBackupFormat } from '@/modules/backup/types/xo-backup.ts'
import { useXoBackupRepositoryCompressionLabels } from '@/modules/backup-repository/composables/use-xo-backup-repository-compression-label.composable.ts'
import { useXoBackupRepositoryTypeLabel } from '@/modules/backup-repository/composables/use-xo-backup-repository-type-label.composable.ts'
import {
  BACKUP_REPOSITORY_COMPRESSIONS,
  DEFAULT_BACKUP_REPOSITORY_COMPRESSION,
} from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import { type FrontXoProxy, useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import type { InputType } from '@core/components/ui/input/UiInput.vue'
import { type FormValidationConfig, mergeValidationConfigs, required, requiredIf } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import type { BACKUP_REPOSITORY_COMPRESSION } from '@vates/types'
import { computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { BACKUP_REPOSITORY_TYPE, type BackupRepositoryType, type BackupRepositoryUrlOptions } from 'xo-remote-parser'

export type BackupRepositoryGeneralFormData = {
  name: string
  type: BackupRepositoryType | undefined
  backupFormat: XoBackupFormat | undefined
  proxy: FrontXoProxy['id'] | null | undefined
  encrypted: boolean
  encryptionKey: string
  // undefined when the compression of the URL is not one of the known ones (written by hand), or in multi-edition
  compression: BACKUP_REPOSITORY_COMPRESSION | undefined
}

export type BackupRepositoryGeneralFormOptions = {
  isEditing?: boolean
  isMultiEdit?: boolean
  // Fields whose values differ between the edited BRs (multi-edition)
  mixedFields?: (keyof BackupRepositoryGeneralFormData)[]
  extraConfig?: FormValidationConfig<BackupRepositoryGeneralFormData>
}

export const ENCRYPTION_KEY_LENGTH = 32
export const ENCRYPTION_KEY_REGEX = new RegExp(`^[0-9a-f]{${ENCRYPTION_KEY_LENGTH}}$`, 'i')

const BACKUP_FORMAT_DOC_URL = 'https://docs.xen-orchestra.com/xo5/incremental_backups'

const MIXED_OPTION_ID = '__MIXED__'

const BLOCK_ONLY_TYPES: BackupRepositoryType[] = ['azure', 'azurite', 's3']

export type BackupRepositoryGeneralForm = ReturnType<typeof useBackupRepositoryGeneralForm>

export function useBackupRepositoryGeneralForm(
  formData: BackupRepositoryGeneralFormData,
  { isEditing = false, isMultiEdit = false, mixedFields = [], extraConfig }: BackupRepositoryGeneralFormOptions = {}
) {
  const { t } = useI18n()

  const { proxies } = useXoProxyCollection()

  const baseConfig: FormValidationConfig<BackupRepositoryGeneralFormData> = {
    errors: {
      onSubmit: () => ({
        name: { required },
        type: isMultiEdit ? {} : { required },
        backupFormat: isMultiEdit ? {} : { required },
        encryptionKey: {
          requiredIf: requiredIf(() => formData.encrypted),
        },
      }),
    },
  }

  const { useField, useFormSelect, useSelect, validate } = useValidatedForm(
    formData,
    mergeValidationConfigs(baseConfig, extraConfig)
  )

  const encryptionKeyInputType: InputType = isEditing ? 'password' : 'text'

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

  // In multi-edition, a select whose value differs between the BRs shows a "[Mixed]" option (undefined value),
  // which keeps the value of each BR
  function isMixed(field: keyof BackupRepositoryGeneralFormData) {
    return isMultiEdit && mixedFields.includes(field)
  }

  const mixedOption = { id: MIXED_OPTION_ID, label: t('mixed-value'), value: undefined }

  const typeOptions = [
    ...(isMixed('type') ? [mixedOption] : []),
    ...Object.values(BACKUP_REPOSITORY_TYPE).map(type => ({
      id: type,
      label: useXoBackupRepositoryTypeLabel(type).value,
      value: type,
    })),
  ]

  const { id: typeSelectId } = useFormSelect('type', typeOptions, {
    required: true,
    disabled: () => isEditing,
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
    ...(isMixed('backupFormat') ? [{ ...mixedOption, hint: undefined }] : []),
    { id: 'block', label: backupFormatLabels.value.block, value: 'block', hint: t('block-based-hint') },
    { id: 'vhd', label: backupFormatLabels.value.vhd, value: 'vhd', hint: t('vhd-file-hint') },
  ])

  const { id: backupFormatSelectId } = useFormSelect('backupFormat', backupFormatOptions, {
    required: true,
    // The format can't be changed in edit mode
    disabled: () => isEditing || formData.type === undefined || isBackupFormatLocked.value,
    option: { label: 'label', value: 'value', properties: source => ({ hint: source.hint }) },
  })

  const compressionLabels = useXoBackupRepositoryCompressionLabels()

  const compressionHints = computed<Partial<Record<BACKUP_REPOSITORY_COMPRESSION, string>>>(() => ({
    zstd: t('zstd-node-requirement'),
    zeros: t('zeros-compression-hint'),
  }))

  const compressionOptions = computed(() =>
    BACKUP_REPOSITORY_COMPRESSIONS.map(compression => ({
      id: compression,
      label: compressionLabels.value[compression],
      value: compression,
      hint: compressionHints.value[compression],
    }))
  )

  const { id: compressionSelectId } = useFormSelect('compression', compressionOptions, {
    required: true,
    // changing the compression would start new full backup chains: it can't be changed in edit mode, like the format
    disabled: () => isEditing || !isBlockFormat.value,
    option: { label: 'label', value: 'value', properties: source => ({ hint: source.hint }) },
  })

  const mixedProxyOption = { id: MIXED_OPTION_ID, name: t('mixed-value') }

  const proxyOptions = computed(() => [...(isMixed('proxy') ? [mixedProxyOption] : []), ...proxies.value])

  const { id: proxySelectId } = useFormSelect('proxy', proxyOptions, {
    searchable: true,
    emptyOption: { label: t('none'), value: isMultiEdit ? null : undefined },
    option: { label: 'name', value: source => (source === mixedProxyOption ? undefined : source.id) },
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
      disabled: isEditing || !isEncryptionAvailable.value,
    })),
    encryptionKey: useField('encryptionKey', () => ({
      label: t('key'),
      required: true,
      type: encryptionKeyInputType,
      disabled: isEditing,
      info: t('n-hexadecimal-characters', { n: ENCRYPTION_KEY_LENGTH }),
    })),
    compression: useSelect(compressionSelectId, () => ({ label: t('compression') })),
  })

  function buildUrlOptions(): BackupRepositoryUrlOptions {
    return {
      ...(formData.encrypted && { encryptionKey: formData.encryptionKey }),
      ...(formData.backupFormat === 'block' && { useVhdDirectory: true }),
      // no compressionType in the URL means the default compression
      // in edit mode, the compression of the URL is kept as is by the caller (urlOptionsToKeep)
      ...(!isEditing &&
        isBlockFormat.value &&
        formData.compression !== undefined &&
        formData.compression !== DEFAULT_BACKUP_REPOSITORY_COMPRESSION && { compressionType: formData.compression }),
    }
  }

  return { formData, bindings, validate, buildUrlOptions, getBackupFormatLabel }
}
