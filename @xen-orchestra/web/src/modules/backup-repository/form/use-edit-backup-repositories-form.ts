import {
  type BackupRepositoryDetailsInitialData,
  type BackupRepositoryDetailsMixedFields,
  useBackupRepositoryDetailsForms,
} from '@/modules/backup-repository/form/use-backup-repository-details-forms.ts'
import {
  type BackupRepositoryGeneralFormData,
  useBackupRepositoryGeneralForm,
} from '@/modules/backup-repository/form/use-backup-repository-general-form.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { getBackupRepositoryDetailsInitialData } from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter, reactive } from 'vue'
import { parse as parseBackupRepositoryUrl } from 'xo-remote-parser'

// Keeps the values shared by all the items, and lists the fields whose values differ
function mergeValues<TData extends Record<string, unknown>>(items: TData[]) {
  const data: Partial<TData> = {}
  const mixedFields: (keyof TData)[] = []

  for (const field of Object.keys(items[0] ?? {}) as (keyof TData)[]) {
    const values = items.map(item => item[field])

    if (new Set(values).size > 1) {
      mixedFields.push(field)
    } else {
      data[field] = values[0]
    }
  }

  return { data, mixedFields }
}

export function useEditBackupRepositoriesForm(rawBrs: MaybeRefOrGetter<FrontXoBackupRepository[]>) {
  const brs = toComputed(rawBrs)

  const hasMixedTypes = computed(() => new Set(brs.value.map(br => parseBackupRepositoryUrl(br.url).type)).size > 1)

  // The form is initialized once from the BRs selected when it is opened
  const initialBrs = brs.value.map(br => ({ br, parsedUrl: parseBackupRepositoryUrl(br.url) }))

  const general = mergeValues(
    initialBrs.map(({ br, parsedUrl }) => ({
      name: br.name,
      type: parsedUrl.type,
      backupFormat: parsedUrl.useVhdDirectory ? ('block' as const) : ('vhd' as const),
      proxy: br.proxy,
      encrypted: parsedUrl.encryptionKey !== undefined,
      encryptionKey: parsedUrl.encryptionKey ?? '',
    }))
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
    true,
    general.mixedFields
  )

  // Details can only be edited together when all the BRs have the same type
  const detailsType = general.data.type === 'azurite' ? 'azure' : general.data.type

  const details =
    detailsType === undefined
      ? undefined
      : mergeValues(
          initialBrs.map(
            ({ br, parsedUrl }) => getBackupRepositoryDetailsInitialData(parsedUrl, br.options)[detailsType] ?? {}
          )
        )

  const { details: detailsForms } = useBackupRepositoryDetailsForms(
    generalForm.formData,
    detailsType === undefined || details === undefined
      ? undefined
      : ({ [detailsType]: details.data } as BackupRepositoryDetailsInitialData),
    detailsType === undefined || details === undefined
      ? undefined
      : ({ [detailsType]: details.mixedFields } as BackupRepositoryDetailsMixedFields)
  )

  return {
    general: generalForm,
    details: detailsForms,
    hasMixedTypes,
  }
}
