import {
  type BackupRepositoryDetailsInitialData,
  useBackupRepositoryFormBase,
} from '@/modules/backup-repository/form/use-backup-repository-form-base.ts'
import type { BackupRepositoryGeneralFormData } from '@/modules/backup-repository/form/use-backup-repository-general-form.ts'
import type { BulkEditBackupRepositoryPayloads } from '@/modules/backup-repository/jobs/xo-backup-repository-bulk-edit.job.ts'
import type { EditBackupRepositoryPayload } from '@/modules/backup-repository/jobs/xo-backup-repository-edit.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { getBackupRepositoryDetailsInitialData } from '@/modules/backup-repository/utils/xo-backup-repository-details-initial-data.util.ts'
import { buildBackupRepositoryDetailsPayload } from '@/modules/backup-repository/utils/xo-backup-repository-details-payload.util.ts'
import { mergeValues, omitMixedValues } from '@/modules/backup-repository/utils/xo-backup-repository-multi-edit.util.ts'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  format as formatBackupRepositoryUrl,
  type ParsedBackupRepositoryUrl,
  parse as parseBackupRepositoryUrl,
} from 'xo-remote-parser'

type InitialBr = {
  br: FrontXoBackupRepository
  parsedUrl: ParsedBackupRepositoryUrl
}

export function useBulkEditBackupRepositoriesForm(brs: FrontXoBackupRepository[]) {
  const { t } = useI18n()

  const initialBrs: InitialBr[] = brs.map(br => ({ br, parsedUrl: parseBackupRepositoryUrl(br.url) }))

  const hasMixedTypes = new Set(initialBrs.map(({ parsedUrl }) => parsedUrl.type)).size > 1

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

  const {
    general: generalForm,
    details: detailsForms,
    currentDetailsForm,
    detailsTitle,
  } = useBackupRepositoryFormBase(
    reactive<BackupRepositoryGeneralFormData>({
      name: '',
      type: undefined,
      backupFormat: undefined,
      proxy: undefined,
      encrypted: false,
      encryptionKey: '',
      ...general.data,
    }),
    {
      isEditing: true,
      isMultiEdit: true,
      mixedFields: general.mixedFields,
      detailsInitialData:
        detailsType === undefined || details === undefined
          ? undefined
          : ({ [detailsType]: details.data } as BackupRepositoryDetailsInitialData),
    }
  )

  function buildPayload(
    initialBr: InitialBr,
    detailsChanges: Record<string, unknown> | undefined
  ): EditBackupRepositoryPayload {
    const { br, parsedUrl } = initialBr
    const { name, proxy } = generalForm.formData

    const detailsPayload =
      detailsChanges === undefined
        ? undefined
        : buildBackupRepositoryDetailsPayload(parsedUrl, br.options, detailsChanges)

    return {
      name: name === t('mixed-value') ? br.name : name,
      // Without editable details (mixed or unknown types), the URL is kept as is
      url:
        detailsPayload === undefined
          ? br.url
          : formatBackupRepositoryUrl({
              ...detailsPayload.urlInfo,
              // The encryption and the backup format can't be changed in edit mode
              ...(parsedUrl.encryptionKey !== undefined && { encryptionKey: parsedUrl.encryptionKey }),
              ...(parsedUrl.useVhdDirectory === true && { useVhdDirectory: true }),
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

    const detailsChanges = detailsForm === undefined ? undefined : omitMixedValues(detailsForm.formData, t('mixed-value'))

    return new Map(initialBrs.map(initialBr => [initialBr.br.id, buildPayload(initialBr, detailsChanges)]))
  }

  return {
    general: generalForm,
    details: detailsForms,
    detailsTitle,
    hasMixedTypes,
    validateAndBuildPayloads,
  }
}
