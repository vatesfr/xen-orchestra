import type { Vdi, VmState } from '@/modules/vm/types/new-xo-vm.type.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import { required, requiredIf, useFormValidation, withMessage } from '@core/packages/form-validation'
import { focusField } from '@core/utils/focus-field.util.ts'
import { objectEntries } from '@core/utils/object.util.ts'
import { mapValues } from 'lodash-es'
import { computed, type MaybeRefOrGetter, nextTick, reactive, ref, toRef, toValue, useId } from 'vue'
import { useI18n } from 'vue-i18n'

const MIN_NEW_VDI_SIZE = 1

type NewVmValidatedStep = 'environment' | 'configuration'

export type NewVmUndersizedVdi = {
  key: Vdi['key']
  name: string
  minSize: number
}

export type NewVmInvalidVdiField = {
  key: Vdi['key']
  field: 'sr' | 'size'
}

const hasSr = (vdi: Vdi) => vdi.sr !== undefined

const hasValidSize = (vdi: Vdi) => vdi.size >= MIN_NEW_VDI_SIZE

export function useNewVmFormValidation(vmState: VmState, undersizedVdis: MaybeRefOrGetter<NewVmUndersizedVdi[]>) {
  const { t } = useI18n()

  const vdiSizeErrors = computed(() =>
    toValue(undersizedVdis).map(vdi => ({
      key: vdi.key,
      message: t('new-vm:disk-size-below-template', { name: vdi.name, size: vdi.minSize }),
    }))
  )

  // A disk added since the last validation is born empty: it is left alone until the next one
  const validatedVdiKeys = ref(new Set<Vdi['key']>())

  const validatedVdis = computed(() => vmState.vdis.filter(vdi => validatedVdiKeys.value.has(vdi.key)))

  // An object value is validated as nested fields: the pool and the template are checked by their id
  const environmentFields = reactive({
    pool: computed(() => vmState.pool?.id),
    template: computed(() => vmState.new_vm_template?.uuid),
  })

  const configurationFields = reactive({
    name: toRef(vmState, 'name'),
    iso: toRef(vmState, 'selectedVdi'),
    vdis: validatedVdis,
    existingVdis: toRef(vmState, 'existingVdis'),
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
          vdis: {
            srRequired: withMessage(
              () => validatedVdis.value.every(hasSr),
              () => t('job:arg:sr-vdi-required')
            ),
            minSize: withMessage(
              () => validatedVdis.value.every(hasValidSize),
              () => t('form:error:field-minimum', { field: t('size'), min: MIN_NEW_VDI_SIZE })
            ),
          },
          existingVdis: {
            minSize: withMessage(
              () => vdiSizeErrors.value.length === 0,
              () => vdiSizeErrors.value[0]?.message ?? ''
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

  // A template disk made too small is told at once, the fields of a new disk once the step was validated
  const invalidVdiFields = computed(() => {
    const invalidFields = toValue(undersizedVdis).map<NewVmInvalidVdiField>(vdi => ({ key: vdi.key, field: 'size' }))

    if (errors.value.vdis === undefined) {
      return invalidFields
    }

    validatedVdis.value.forEach(vdi => {
      if (!hasSr(vdi)) {
        invalidFields.push({ key: vdi.key, field: 'sr' })
      }

      if (!hasValidSize(vdi)) {
        invalidFields.push({ key: vdi.key, field: 'size' })
      }
    })

    return invalidFields
  })

  // The table of the disks puts this id on the first of its fields in error
  const invalidVdiFieldId = useId()

  // In the order the fields are laid out
  const fieldIds = {
    pool: useId(),
    template: useId(),
    iso: useId(),
    name: useId(),
    existingVdis: invalidVdiFieldId,
    vdis: invalidVdiFieldId,
  }

  async function focusFirstError() {
    const firstFieldId = objectEntries(fieldIds).find(([field]) => errors.value[field] !== undefined)?.[1]

    if (firstFieldId === undefined) {
      return
    }

    await nextTick()

    focusField(firstFieldId)
  }

  function validateStep(step: NewVmValidatedStep) {
    if (step === 'configuration') {
      validatedVdiKeys.value = new Set(vmState.vdis.map(vdi => vdi.key))
    }

    return stepValidations[step].validate()
  }

  function resetStep(step: NewVmValidatedStep) {
    stepValidations[step].reset()
  }

  return {
    errors,
    errorMessages,
    vdiSizeErrors,
    invalidVdiFields,
    fieldIds,
    focusFirstError,
    validateStep,
    resetStep,
  }
}
