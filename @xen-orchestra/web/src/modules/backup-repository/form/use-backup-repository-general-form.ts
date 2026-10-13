import type { XoBackupFormat } from '@/modules/backup/types/xo-backup.ts'
import { useXoBackupRepositoryTypeLabel } from '@/modules/backup-repository/composables/use-xo-backup-repository-type-label.composable.ts'
import { type FrontXoProxy, useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import type { InputType } from '@core/components/ui/input/UiInput.vue'
import { regex, required, requiredIf, withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { computed, type MaybeRefOrGetter, reactive, toValue, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { BACKUP_REPOSITORY_TYPE, type BackupRepositoryType, type BackupRepositoryUrlOptions } from 'xo-remote-parser'

export type BackupRepositoryGeneralFormData = {
  name: string
  type: BackupRepositoryType | undefined
  backupFormat: XoBackupFormat | undefined
  // In multi-edition, null is "None" and undefined is a value that differs between the BRs
  proxy: FrontXoProxy['id'] | null | undefined
  // undefined when the value differs between the BRs (multi-edition)
  encrypted: boolean | undefined
  encryptionKey: string
}

const ENCRYPTION_KEY_LENGTH = 32
const ENCRYPTION_KEY_REGEX = new RegExp(`^[0-9a-f]{${ENCRYPTION_KEY_LENGTH}}$`, 'i')

const BACKUP_FORMAT_DOC_URL = 'https://docs.xen-orchestra.com/xo5/incremental_backups'

export const BLOCK_ONLY_TYPES: BackupRepositoryType[] = ['azure', 'azurite', 's3']

export type BackupRepositoryGeneralForm = ReturnType<typeof useBackupRepositoryGeneralForm>

export type BackupRepositoryGeneralFormMultiEditConfig = {
  // The VHD format is forbidden when one of the edited BRs requires the block format
  isVhdForbidden: MaybeRefOrGetter<boolean>
}

export function useBackupRepositoryGeneralForm(
  formData: BackupRepositoryGeneralFormData,
  isEditing = false,
  multiEditConfig?: BackupRepositoryGeneralFormMultiEditConfig
) {
  const isMultiEdit = multiEditConfig !== undefined

  const { t } = useI18n()

  const { proxies } = useXoProxyCollection()

  const { useField, useFormSelect, useSelect, validate } = useValidatedForm(formData, {
    errors: {
      // In edit mode, the key is locked and comes back obfuscated from the API, so it can't match the regex
      onBlur: () => ({
        encryptionKey: isEditing
          ? {}
          : {
              regex: withMessage(regex(ENCRYPTION_KEY_REGEX), () =>
                t('encryption-key-invalid', { n: ENCRYPTION_KEY_LENGTH })
              ),
            },
      }),
      onSubmit: () => ({
        name: { required },
        // In multi-edition, the type and the format can differ between the BRs
        type: isMultiEdit ? {} : { required },
        backupFormat: isMultiEdit ? {} : { required },
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

  const typeOptions = Object.values(BACKUP_REPOSITORY_TYPE).map(type => ({
    id: type,
    label: useXoBackupRepositoryTypeLabel(type).value,
    value: type,
  }))

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
    { id: 'block', label: backupFormatLabels.value.block, value: 'block', hint: t('block-based-hint') },
    { id: 'vhd', label: backupFormatLabels.value.vhd, value: 'vhd', hint: t('vhd-file-hint') },
  ])

  const { id: backupFormatSelectId } = useFormSelect('backupFormat', backupFormatOptions, {
    required: true,
    // Encryption requires block format, and it can't be changed in edit mode
    disabled: () =>
      formData.type === undefined || isBackupFormatLocked.value || (isEditing && formData.encrypted === true),
    option: {
      label: 'label',
      value: 'value',
      properties: source => ({ hint: source.hint }),
      disabled: source => source.value === 'vhd' && toValue(multiEditConfig?.isVhdForbidden) === true,
    },
  })

  const { id: proxySelectId } = useFormSelect('proxy', proxies, {
    searchable: true,
    emptyOption: { label: t('none'), value: isMultiEdit ? null : undefined },
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
      disabled: isEditing || !isEncryptionAvailable.value,
    })),
    encryptionKey: useField('encryptionKey', () => ({
      label: t('key'),
      required: true,
      type: (isEditing ? 'password' : 'text') as InputType,
      disabled: isEditing,
      info: t('n-hexadecimal-characters', { n: ENCRYPTION_KEY_LENGTH }),
    })),
  })

  function buildUrlOptions(): BackupRepositoryUrlOptions {
    return {
      ...(formData.encrypted && { encryptionKey: formData.encryptionKey }),
      ...(formData.backupFormat === 'block' && { useVhdDirectory: true }),
    }
  }

  return { formData, bindings, validate, buildUrlOptions, getBackupFormatLabel }
}
