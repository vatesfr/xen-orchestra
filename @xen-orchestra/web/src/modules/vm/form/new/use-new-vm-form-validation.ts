import { vifMacAddress } from '@/modules/vif/form/vif-mac-address.rule.ts'
import type { Vdi, Vif, VmState } from '@/modules/vm/types/new-xo-vm.type.ts'
import { getAllVdis } from '@/modules/vm/utils/new-vm.util.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import { required, requiredIf, useFormValidation, withMessage } from '@core/packages/form-validation'
import { focusField } from '@core/utils/focus-field.util.ts'
import { objectEntries } from '@core/utils/object.util.ts'
import { mapValues } from 'lodash-es'
import { computed, type MaybeRefOrGetter, nextTick, reactive, ref, toRef, toValue, useId } from 'vue'
import { useI18n } from 'vue-i18n'

const MIN_NEW_VDI_SIZE = 1

const MAX_ROWS_WITHOUT_WARNING = 8

type NewVmValidatedStep = 'environment' | 'configuration'

export type NewVmUndersizedVdi = {
  key: Vdi['key']
  minSize: number
}

export type NewVmRowIssue<TField extends string = string> = {
  field: TField
  message: string
}

export type NewVmRowIssues<TField extends string = string> = Map<string, NewVmRowIssue<TField>[]>

export type NewVmVifField = 'network' | 'mac'

export type NewVmVdiField = 'sr' | 'size'

export type NewVmTableValidation<TField extends string = string> = {
  issues: NewVmRowIssues<TField>
  warnedKeys: Set<string>
  warning: string | undefined
  errorFieldId: string
}

const hasSr = (vdi: Vdi) => vdi.sr !== undefined

const hasValidSize = (vdi: Vdi) => vdi.size >= MIN_NEW_VDI_SIZE

const hasNetwork = (vif: Vif) => Boolean(vif.network)

const hasValidMac = (vif: Vif) => vifMacAddress.exec(vif.mac)

function collectIssues<TRow extends { key: string }, TField extends string>(
  rows: TRow[],
  getIssues: (row: TRow) => (NewVmRowIssue<TField> | false)[]
): NewVmRowIssues<TField> {
  return new Map(
    rows.flatMap(row => {
      const issues = getIssues(row).filter(issue => issue !== false)

      return issues.length > 0 ? [[row.key, issues] as const] : []
    })
  )
}

function getTableValidation<TField extends string>({
  issues,
  rows,
  tooManyRowsWarning,
  errorFieldId,
}: {
  issues: NewVmRowIssues<TField>
  rows: { key: string }[]
  tooManyRowsWarning: string
  errorFieldId: string
}): NewVmTableValidation<TField> {
  const warnedKeys = new Set(rows.slice(MAX_ROWS_WITHOUT_WARNING).map(row => row.key))

  return { issues, warnedKeys, warning: warnedKeys.size > 0 ? tooManyRowsWarning : undefined, errorFieldId }
}

export function useNewVmFormValidation(vmState: VmState, undersizedVdis: MaybeRefOrGetter<NewVmUndersizedVdi[]>) {
  const { t } = useI18n()

  const isConfigurationValidated = ref(false)

  const validatedVdiKeys = ref(new Set<Vdi['key']>())

  const allVdis = computed(() => getAllVdis(vmState))

  const vifIssues = computed(() =>
    collectIssues<Vif, NewVmVifField>(isConfigurationValidated.value ? vmState.vifs : [], vif => [
      !hasNetwork(vif) && { field: 'network', message: t('new-vm:network-mandatory') },
      !hasValidMac(vif) && { field: 'mac', message: t('new-vm:mac-address-invalid') },
    ])
  )

  const vdiIssues = computed(() =>
    collectIssues<Vdi, NewVmVdiField>(allVdis.value, vdi => {
      const minSize = toValue(undersizedVdis).find(undersizedVdi => undersizedVdi.key === vdi.key)?.minSize
      const isValidated = validatedVdiKeys.value.has(vdi.key)

      return [
        minSize !== undefined && { field: 'size', message: t('new-vm:size-below-template', { size: minSize }) },
        isValidated && !hasSr(vdi) && { field: 'sr', message: t('new-vm:sr-mandatory') },
        isValidated &&
          !hasValidSize(vdi) && { field: 'size', message: t('new-vm:size-minimum', { min: MIN_NEW_VDI_SIZE }) },
      ]
    })
  )

  const fieldIds = {
    pool: useId(),
    template: useId(),
    iso: useId(),
    name: useId(),
    vifs: useId(),
    vdis: useId(),
  }

  const vifsValidation = computed(() =>
    getTableValidation({
      issues: vifIssues.value,
      rows: vmState.vifs,
      tooManyRowsWarning: t('new-vm:too-many-vifs', { n: MAX_ROWS_WITHOUT_WARNING }),
      errorFieldId: fieldIds.vifs,
    })
  )

  const vdisValidation = computed(() =>
    getTableValidation({
      issues: vdiIssues.value,
      rows: allVdis.value,
      tooManyRowsWarning: t('new-vm:too-many-vdis', { n: MAX_ROWS_WITHOUT_WARNING }),
      errorFieldId: fieldIds.vdis,
    })
  )

  const environmentFields = reactive({
    pool: computed(() => vmState.pool?.id),
    template: computed(() => vmState.new_vm_template?.uuid),
  })

  const configurationFields = reactive({
    name: toRef(vmState, 'name'),
    iso: toRef(vmState, 'selectedVdi'),
  })

  const stepValidations = {
    environment: useFormValidation(environmentFields, {
      errors: {
        onSubmit: () => ({
          pool: { required },
          template: { required },
        }),
      },
    }),
    configuration: useFormValidation(configurationFields, {
      errors: {
        onSubmit: () => ({
          name: { required },
          iso: {
            requiredIf: withMessage(
              requiredIf(() => vmState.installMode === 'cdrom'),
              () => t('form:error:required')
            ),
          },
        }),
      },
    }),
  }

  const errors = computed(() => ({
    ...stepValidations.environment.errors.value,
    ...stepValidations.configuration.errors.value,
  }))

  const errorMessages = computed(() =>
    mapValues(errors.value, (error): InputWrapperMessage | undefined =>
      error === undefined ? undefined : { content: error, accent: 'danger' }
    )
  )

  function isInError(field: keyof typeof fieldIds) {
    if (field === 'vifs') {
      return vifIssues.value.size > 0
    }

    if (field === 'vdis') {
      return vdiIssues.value.size > 0
    }

    return errors.value[field] !== undefined
  }

  async function focusFirstError() {
    const firstFieldId = objectEntries(fieldIds).find(([field]) => isInError(field))?.[1]

    if (firstFieldId === undefined) {
      return
    }

    await nextTick()

    focusField(firstFieldId)
  }

  async function validateStep(step: NewVmValidatedStep) {
    if (step === 'environment') {
      return stepValidations.environment.validate()
    }

    isConfigurationValidated.value = true
    validatedVdiKeys.value = new Set(vmState.vdis.map(vdi => vdi.key))

    const areFieldsValid = await stepValidations.configuration.validate()

    return areFieldsValid && vifIssues.value.size === 0 && vdiIssues.value.size === 0
  }

  function resetStep(step: NewVmValidatedStep) {
    if (step === 'configuration') {
      isConfigurationValidated.value = false
      validatedVdiKeys.value = new Set()
    }

    stepValidations[step].reset()
  }

  return {
    errors,
    errorMessages,
    vifsValidation,
    vdisValidation,
    fieldIds,
    focusFirstError,
    validateStep,
    resetStep,
  }
}
