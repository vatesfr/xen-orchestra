import {
  type AzureBackupRepositoryDetailsFormData,
  buildAzureBackupRepositoryDetailsPayload,
} from '@/modules/backup-repository/form/details/use-azure-backup-repository-details-form.ts'
import {
  buildLocalBackupRepositoryDetailsPayload,
  type LocalBackupRepositoryDetailsFormData,
} from '@/modules/backup-repository/form/details/use-local-backup-repository-details-form.ts'
import {
  buildNfsBackupRepositoryDetailsPayload,
  type NfsBackupRepositoryDetailsFormData,
} from '@/modules/backup-repository/form/details/use-nfs-backup-repository-details-form.ts'
import {
  buildS3BackupRepositoryDetailsPayload,
  type S3BackupRepositoryDetailsFormData,
} from '@/modules/backup-repository/form/details/use-s3-backup-repository-details-form.ts'
import {
  buildSmbBackupRepositoryDetailsPayload,
  type SmbBackupRepositoryDetailsFormData,
} from '@/modules/backup-repository/form/details/use-smb-backup-repository-details-form.ts'
import {
  type BackupRepositoryDetailsInitialData,
  useBackupRepositoryDetailsForms,
} from '@/modules/backup-repository/form/use-backup-repository-details-forms.ts'
import {
  BACKUP_REPOSITORY_FORM_MODE,
  type BackupRepositoryGeneralFormData,
  BLOCK_ONLY_TYPES,
  useBackupRepositoryGeneralForm,
} from '@/modules/backup-repository/form/use-backup-repository-general-form.ts'
import type { BulkEditBackupRepositoryPayloads } from '@/modules/backup-repository/jobs/xo-backup-repository-bulk-edit.job.ts'
import type { EditBackupRepositoryPayload } from '@/modules/backup-repository/jobs/xo-backup-repository-edit.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { BackupRepositoryDetailsPayload } from '@/modules/backup-repository/types/new-backup-repository.type.ts'
import { getBackupRepositoryDetailsInitialData } from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  format as formatBackupRepositoryUrl,
  parse as parseBackupRepositoryUrl,
  type ParsedBackupRepositoryUrl,
} from 'xo-remote-parser'

type InitialBr = {
  br: FrontXoBackupRepository
  parsedUrl: ParsedBackupRepositoryUrl
}

// Keeps the values shared by all the items, and lists the fields whose values differ.
function mergeValues<TFormData extends Record<string, unknown>>(
  items: TFormData[],
  mixedValue: string,
  textFields?: (keyof TFormData)[]
) {
  const data: Partial<TFormData> = {}
  const mixedFields: (keyof TFormData)[] = []

  for (const field of Object.keys(items[0] ?? {}) as (keyof TFormData)[]) {
    const values = items.map(item => item[field])

    if (new Set(values).size > 1) {
      mixedFields.push(field)

      data[field] = (
        (textFields?.includes(field) ?? typeof values[0] === 'string') ? mixedValue : undefined
      ) as TFormData[keyof TFormData]
    } else {
      data[field] = values[0]
    }
  }

  console.log(data, mixedFields)

  return { data, mixedFields }
}

// Keeps the values to apply to all the items: the ones left mixed don't change on each item
function getChangedValues(formData: Record<string, unknown>, mixedValue: string) {
  return Object.fromEntries(Object.entries(formData).filter(([, value]) => value !== mixedValue && value !== undefined))
}

function buildDetailsPayload(
  { br, parsedUrl }: InitialBr,
  changes: Record<string, unknown>
): BackupRepositoryDetailsPayload | undefined {
  const initialData = getBackupRepositoryDetailsInitialData(parsedUrl, br.options)

  switch (parsedUrl.type) {
    case 'file':
      return buildLocalBackupRepositoryDetailsPayload({
        ...initialData.file,
        ...changes,
      } as LocalBackupRepositoryDetailsFormData)
    case 'nfs':
      return buildNfsBackupRepositoryDetailsPayload({
        ...initialData.nfs,
        ...changes,
      } as NfsBackupRepositoryDetailsFormData)
    case 'smb':
      return buildSmbBackupRepositoryDetailsPayload({
        ...initialData.smb,
        ...changes,
      } as SmbBackupRepositoryDetailsFormData)
    case 's3':
      return buildS3BackupRepositoryDetailsPayload({
        ...initialData.s3,
        ...changes,
      } as S3BackupRepositoryDetailsFormData)
    case 'azure':
    case 'azurite':
      return buildAzureBackupRepositoryDetailsPayload(
        { ...initialData.azure, ...changes } as AzureBackupRepositoryDetailsFormData,
        parsedUrl.type
      )
    default:
      return undefined
  }
}

export function useEditBackupRepositoriesForm(rawBrs: MaybeRefOrGetter<FrontXoBackupRepository[]>) {
  const { t } = useI18n()

  const brs = toComputed(rawBrs)

  const hasMixedTypes = computed(() => new Set(brs.value.map(br => parseBackupRepositoryUrl(br.url).type)).size > 1)

  const initialBrs: InitialBr[] = brs.value.map(br => ({ br, parsedUrl: parseBackupRepositoryUrl(br.url) }))

  const isVhdForbidden = initialBrs.some(
    ({ parsedUrl }) =>
      (parsedUrl.type !== undefined && BLOCK_ONLY_TYPES.includes(parsedUrl.type)) ||
      parsedUrl.encryptionKey !== undefined
  )

  const general = mergeValues(
    initialBrs.map(({ br, parsedUrl }) => ({
      name: br.name,
      type: parsedUrl.type,
      backupFormat: parsedUrl.useVhdDirectory ? ('block' as const) : ('vhd' as const),
      proxy: br.proxy ?? null,
    })),
    t('mixed-value'),
    ['name']
  )

  const generalForm = useBackupRepositoryGeneralForm(
    reactive<BackupRepositoryGeneralFormData>({
      name: '',
      type: undefined,
      backupFormat: undefined,
      proxy: undefined,
      encrypted: false,
      encryptionKey: '',
      ...general.data,
    }),
    BACKUP_REPOSITORY_FORM_MODE.MULTI_EDIT,
    isVhdForbidden
  )

  const detailsType = general.data.type === 'azurite' ? 'azure' : general.data.type

  const details =
    detailsType === undefined
      ? undefined
      : mergeValues(
          initialBrs.map(
            ({ br, parsedUrl }) => getBackupRepositoryDetailsInitialData(parsedUrl, br.options)[detailsType] ?? {}
          ),
          t('mixed-value')
        )

  const { details: detailsForms, currentDetailsForm } = useBackupRepositoryDetailsForms(
    generalForm.formData,
    detailsType === undefined || details === undefined
      ? undefined
      : ({ [detailsType]: details.data } as BackupRepositoryDetailsInitialData)
  )

  function buildPayload(initialBr: InitialBr, detailsChanges: Record<string, unknown>): EditBackupRepositoryPayload {
    const { br, parsedUrl } = initialBr
    const { name, backupFormat, proxy } = generalForm.formData
    const mixedValue = t('mixed-value')

    const detailsPayload = buildDetailsPayload(initialBr, detailsChanges)

    const useVhdDirectory = backupFormat === undefined ? parsedUrl.useVhdDirectory === true : backupFormat === 'block'

    return {
      name: name === mixedValue ? br.name : name,
      // A BR of an unknown type can't be rebuilt, so its URL is kept as is
      url:
        detailsPayload === undefined
          ? br.url
          : formatBackupRepositoryUrl({
              ...detailsPayload.urlInfo,
              // The encryption can't be changed in edit mode
              ...(parsedUrl.encryptionKey !== undefined && { encryptionKey: parsedUrl.encryptionKey }),
              ...(useVhdDirectory && { useVhdDirectory: true }),
            }),
      options: detailsPayload === undefined ? (br.options ?? null) : (detailsPayload.options ?? null),
      proxy: proxy === undefined ? (br.proxy ?? null) : proxy,
    }
  }

  async function validateAndBuildPayloads(): Promise<BulkEditBackupRepositoryPayloads | undefined> {
    const detailsForm = currentDetailsForm.value

    const [isGeneralValid, areDetailsValid] = await Promise.all([
      generalForm.validate(),
      detailsForm === undefined ? true : detailsForm.validate(),
    ])

    if (!isGeneralValid || !areDetailsValid) {
      return undefined
    }

    const detailsChanges = detailsForm === undefined ? {} : getChangedValues(detailsForm.formData, t('mixed-value'))

    return new Map(initialBrs.map(initialBr => [initialBr.br.id, buildPayload(initialBr, detailsChanges)]))
  }

  return {
    general: generalForm,
    details: detailsForms,
    hasMixedTypes,
    validateAndBuildPayloads,
  }
}
