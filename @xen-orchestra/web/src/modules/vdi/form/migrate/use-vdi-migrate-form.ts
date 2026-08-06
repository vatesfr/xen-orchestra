import { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import { getPbdsConnectionStatus } from '@/modules/pbd/utils/xo-pbd.util.ts'
import { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import {
  type FrontXoSr,
  useXoSrCollection,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { isSrWritable } from '@/modules/storage-repository/utils/xo-sr.util.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { ONE_GB } from '@/shared/constants.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import { objectIcon } from '@core/icons'
import { required } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export type VdiMigrateFormData = {
  sr: FrontXoSr['id'] | undefined
}

export function useVdiMigrateForm(rawVdi: MaybeRefOrGetter<FrontXoVdi>) {
  const { t } = useI18n()

  const vdi = toComputed(rawVdi)

  const formData = reactive<VdiMigrateFormData>({
    sr: undefined,
  })

  const {
    useFormSelect,
    useSelect,
    validate,
    reset: resetValidation,
  } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        sr: { required },
      }),
    },
  })

  const { srs, useGetSrById } = useXoSrCollection()
  const { getSrLocation } = useXoSrUtils()
  const { pbdsBySr } = useXoPbdCollection()

  const availableSrs = computed(() =>
    srs.value.filter(sr => sr.$pool === vdi.value.$pool && sr.id !== vdi.value.$SR && isSrWritable(sr))
  )

  const currentSr = useGetSrById(() => vdi.value.$SR)
  const selectedSr = useGetSrById(() => formData.sr)

  const requiresForceMigrate = computed(() => {
    if (!selectedSr.value || !currentSr.value || selectedSr.value.shared) {
      return false
    }
    return selectedSr.value.$container !== currentSr.value.$container
  })

  const srWarning = computed<InputWrapperMessage | undefined>(() =>
    requiresForceMigrate.value ? { content: t('vdi-on-different-sr-warning'), accent: 'warning' as const } : undefined
  )

  const { id: srSelectId } = useFormSelect('sr', availableSrs, {
    searchable: true,
    required: true,
    placeholder: () => t('action:select-storage'),
    option: {
      label: sr => {
        const gbLeft = Math.floor(Math.max(sr.size - sr.physical_usage, 0) / ONE_GB)
        return `${sr.name_label} (${getSrLocation(sr)}) - ${t('n-gb-left', { n: gbLeft })}`
      },
      value: 'id',
      properties: sr => ({ icon: objectIcon('sr', getPbdsConnectionStatus(pbdsBySr.value.get(sr.id) ?? [])) }),
    },
  })

  const srSelectBindings = useSelect(srSelectId, () => ({
    label: t('destination-sr'),
    ...(srWarning.value !== undefined && { warning: srWarning.value }),
  }))

  async function validateAndGetSrId(): Promise<FrontXoSr['id'] | undefined> {
    const isValid = await validate()

    return isValid ? formData.sr : undefined
  }

  function reset() {
    formData.sr = undefined
    resetValidation()
  }

  return {
    srSelectBindings,
    selectedSr,
    requiresForceMigrate,
    validateAndGetSrId,
    reset,
  }
}
