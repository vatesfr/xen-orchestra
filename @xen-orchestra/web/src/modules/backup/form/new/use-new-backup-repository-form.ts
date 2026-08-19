import type { XoBackupFormat } from '@/modules/backup/types/xo-backup.ts'
import type { BackupRepositoryType } from '@/modules/backup/utils/xo-backup-repository-url.util.ts'
import { useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import type { FrontXoProxy } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { regex, required, requiredIf, withMessage } from '@core/packages/form-validation'
import { defineFormSteps } from '@core/packages/validated-form'
import { useMultiStepValidatedForm } from '@xen-orchestra/web-core/packages/validated-form/use-multi-step-validated-form.ts'
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

type NewBackupRepositoryFormData = {
  general: {
    name: string
    type: BackupRepositoryType | undefined
    backupFormat: XoBackupFormat | undefined
    proxy: FrontXoProxy['id'] | undefined
    encrypted: boolean
    encryptionKey: string
  }
  details: {
    azureHostName: string
    azureAccountName: string
    azureKey: string
    azureContainerName: string
    azurePathInContainer: string
    nfsHost: string
    nfsPort: string
    nfsPath: string
    nfsCustomOptions: string
    localPath: string
    smbPathOnShare: string
    smbSubfolder: string
    smbUsername: string
    smbPassword: string
    smbDomain: string
    smbCustomOptions: string
    s3Endpoint: string
    s3UseHttps: boolean
    s3AllowUnauthorized: boolean
    s3Region: string
    s3AccessKeyId: string
    s3Secret: string
    s3Bucket: string
    s3PathInBucket: string
  }
}

const ENCRYPTION_KEY_LENGTH = 32
const ENCRYPTION_KEY_REGEX = /^[0-9a-f]{32}$/i

const BACKUP_FORMAT_DOC_URL = 'https://docs.xen-orchestra.com/xo5/incremental_backups'

const BLOCK_ONLY_TYPES: BackupRepositoryType[] = ['azure', 'azurite', 's3']

const NFS_DEFAULT_PORT = 2049

const SMB_DEFAULT_DOMAIN = 'WORKGROUP'

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
    details: {
      azureHostName: '',
      azureAccountName: '',
      azureKey: '',
      azureContainerName: '',
      azurePathInContainer: '',
      nfsHost: '',
      nfsPort: '',
      nfsPath: '',
      nfsCustomOptions: '',
      localPath: '',
      smbPathOnShare: '',
      smbSubfolder: '',
      smbUsername: '',
      smbPassword: '',
      smbDomain: '',
      smbCustomOptions: '',
      s3Endpoint: '',
      s3UseHttps: false,
      s3AllowUnauthorized: false,
      s3Region: '',
      s3AccessKeyId: '',
      s3Secret: '',
      s3Bucket: '',
      s3PathInBucket: '',
    },
  })

  const isAzureType = computed(() => formData.general.type === 'azure' || formData.general.type === 'azurite')
  const isNfsType = computed(() => formData.general.type === 'nfs')
  const isLocalType = computed(() => formData.general.type === 'file')
  const isSmbType = computed(() => formData.general.type === 'smb')
  const isS3Type = computed(() => formData.general.type === 's3')

  const { useField, useFormSelect, useSelect, currentStep, next, back, validateAllSteps } = useMultiStepValidatedForm(
    formData,
    {
      general: {
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
              requiredIf: requiredIf(() => formData.general.encrypted),
            },
          }),
        },
      },
      details: {
        errors: {
          onSubmit: () => ({
            azureHostName: { requiredIf: requiredIf(isAzureType) },
            azureAccountName: { requiredIf: requiredIf(isAzureType) },
            azureKey: { requiredIf: requiredIf(isAzureType) },
            azureContainerName: { requiredIf: requiredIf(isAzureType) },
            nfsHost: { requiredIf: requiredIf(isNfsType) },
            nfsPath: { requiredIf: requiredIf(isNfsType) },
            localPath: { requiredIf: requiredIf(isLocalType) },
            smbPathOnShare: { requiredIf: requiredIf(isSmbType) },
            smbDomain: { requiredIf: requiredIf(isSmbType) },
            s3Endpoint: { requiredIf: requiredIf(isS3Type) },
            s3Region: { requiredIf: requiredIf(isS3Type) },
            s3AccessKeyId: { requiredIf: requiredIf(isS3Type) },
            s3Secret: { requiredIf: requiredIf(isS3Type) },
            s3Bucket: { requiredIf: requiredIf(isS3Type) },
          }),
        },
      },
    }
  )

  const isBackupFormatLocked = computed(
    () => formData.general.type !== undefined && BLOCK_ONLY_TYPES.includes(formData.general.type)
  )

  watch(isBackupFormatLocked, isLocked => {
    formData.general.backupFormat = isLocked ? 'block' : undefined
  })

  watch(
    () => formData.details.s3UseHttps,
    useHttps => {
      if (!useHttps) {
        formData.details.s3AllowUnauthorized = false
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
    disabled: () => formData.general.type === undefined || isBackupFormatLocked.value,
    option: { label: 'label', value: 'value', properties: source => ({ hint: source.hint }) },
  })

  const { id: proxySelectId } = useFormSelect('proxy', proxies, {
    searchable: true,
    emptyOption: { label: t('none'), value: undefined },
    option: { label: 'name', value: 'id' },
  })

  return {
    currentStep,
    selectedType: computed(() => formData.general.type),
    next,
    back,
    validateAllSteps,
    nameInputBindings: useField('name', () => ({ label: t('name'), required: true })),
    typeSelectBindings: useSelect(typeSelectId, () => ({ label: t('type') })),
    backupFormatSelectBindings: useSelect(backupFormatSelectId, () => ({
      label: t('backup-format'),
      learnMoreUrl: BACKUP_FORMAT_DOC_URL,
    })),
    proxySelectBindings: useSelect(proxySelectId, () => ({ label: t('proxy') })),
    encryptedCheckboxBindings: useField('encrypted', () => ({
      label: t('encrypted'),
      warning: t('encryption-key-loss-warning'),
    })),
    encryptionKeyInputBindings: useField('encryptionKey', () => ({
      label: t('key'),
      required: true,
      info: t('n-hexadecimal-characters', { n: ENCRYPTION_KEY_LENGTH }),
    })),
    azureHostNameInputBindings: useField('azureHostName', () => ({ label: t('host-name'), required: true })),
    azureAccountNameInputBindings: useField('azureAccountName', () => ({ label: t('account-name'), required: true })),
    azureKeyInputBindings: useField('azureKey', () => ({ label: t('key'), required: true })),
    azureContainerNameInputBindings: useField('azureContainerName', () => ({
      label: t('container-name'),
      required: true,
    })),
    azurePathInContainerInputBindings: useField('azurePathInContainer', () => ({ label: t('path-in-container') })),
    nfsHostInputBindings: useField('nfsHost', () => ({ label: t('host-or-ip-address'), required: true })),
    nfsPortInputBindings: useField('nfsPort', () => ({
      label: t('port'),
      placeholder: NFS_DEFAULT_PORT,
      info: t('value-by-default', { value: NFS_DEFAULT_PORT }),
    })),
    nfsPathInputBindings: useField('nfsPath', () => ({ label: t('path-on-share'), required: true })),
    nfsCustomOptionsInputBindings: useField('nfsCustomOptions', () => ({ label: t('custom-options') })),
    localPathInputBindings: useField('localPath', () => ({
      label: t('backup-repository-path'),
      required: true,
      info: formData.general.proxy !== undefined ? t('path-must-be-absolute-on-proxy-host') : undefined,
    })),
    smbPathOnShareInputBindings: useField('smbPathOnShare', () => ({
      label: t('path-on-share'),
      required: true,
      prefix: '\\\\',
      info: t('smb-share-sample'),
    })),
    smbSubfolderInputBindings: useField('smbSubfolder', () => ({
      label: t('subfolder'),
      prefix: '\\',
      info: t('smb-subfolder-sample'),
    })),
    smbUsernameInputBindings: useField('smbUsername', () => ({ label: t('username') })),
    smbPasswordInputBindings: useField('smbPassword', () => ({ label: t('password') })),
    smbDomainInputBindings: useField('smbDomain', () => ({
      label: t('domain'),
      required: true,
      placeholder: SMB_DEFAULT_DOMAIN,
      info: t('value-by-default', { value: SMB_DEFAULT_DOMAIN }),
    })),
    smbCustomOptionsInputBindings: useField('smbCustomOptions', () => ({ label: t('custom-options') })),
    s3EndpointInputBindings: useField('s3Endpoint', () => ({
      label: t('endpoint-url'),
      required: true,
      info: t('s3-endpoint-sample'),
    })),
    s3UseHttpsCheckboxBindings: useField('s3UseHttps', () => ({ label: t('use-https') })),
    s3AllowUnauthorizedCheckboxBindings: useField('s3AllowUnauthorized', () => ({ label: t('allow-unauthorized') })),
    s3RegionInputBindings: useField('s3Region', () => ({ label: t('region'), required: true })),
    s3AccessKeyIdInputBindings: useField('s3AccessKeyId', () => ({ label: t('access-key-id'), required: true })),
    s3SecretInputBindings: useField('s3Secret', () => ({ label: t('secret'), required: true })),
    s3BucketInputBindings: useField('s3Bucket', () => ({ label: t('bucket-name'), required: true })),
    s3PathInBucketInputBindings: useField('s3PathInBucket', () => ({ label: t('path-in-bucket') })),
  }
}
