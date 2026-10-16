import { usePrivilegeSelectorMatches } from '@/modules/role/composables/use-privilege-selector-matches.composable.ts'
import { usePrivilegeSelectorSchema } from '@/modules/role/composables/use-privilege-selector-schema.composable.ts'
import type { NewPrivilegePayload } from '@/modules/role/types.ts'
import {
  getResourceActions,
  isSelectablePrivilegeResource,
  PRIVILEGE_RESOURCES,
  type PrivilegeAction,
  type PrivilegeResource,
} from '@/modules/role/utils/privilege-catalogue.util.ts'
import {
  buildManualSelectionSelector,
  getAvailablePrivilegeScopeTypes,
  getPrivilegeScopeType,
  parseManualSelectionSelector,
} from '@/modules/role/utils/privilege-scope.util.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import { queryFilter, required } from '@core/packages/form-validation'
import { defineFormSteps, useMultiStepValidatedForm } from '@core/packages/validated-form'
import type { XoAclBasePrivilege } from '@vates/types'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

// `useField` shapes the error for input wrappers, which the query builder and the scope tables are not:
// they only need the raw text to display it themselves.
function getErrorContent(error: InputWrapperMessage | undefined) {
  if (typeof error === 'string') {
    return error
  }

  if (Array.isArray(error)) {
    return undefined
  }

  return error?.content
}

export function useNewPrivilegeForm(privilegeToEdit: NewPrivilegePayload | undefined) {
  const { t } = useI18n()

  const initialScopeType = getPrivilegeScopeType(privilegeToEdit?.selector)

  const formData = defineFormSteps({
    details: {
      resource: privilegeToEdit?.resource as PrivilegeResource | undefined,
      actions: privilegeToEdit === undefined ? [] : [privilegeToEdit.action],
      effect: privilegeToEdit?.effect ?? ('allow' as XoAclBasePrivilege['effect']),
    },
    scope: {
      scopeType: initialScopeType,
      selector: initialScopeType === 'dynamic-selection' ? (privilegeToEdit?.selector ?? '') : '',
      selectedIds:
        initialScopeType === 'manual-selection'
          ? (parseManualSelectionSelector(privilegeToEdit?.selector ?? '') ?? [])
          : [],
    },
    review: {},
  })

  const { useField, useFormSelect, useSelect, currentStep, next, back, backTo, validateAllSteps } =
    useMultiStepValidatedForm(formData, {
      details: {
        errors: {
          onSubmit: () => ({
            resource: { required },
            actions: { required },
          }),
        },
      },
      scope: {
        errors: {
          onSubmit: () => ({
            scopeType: { required },
            selector: formData.scope.scopeType === 'dynamic-selection' ? { required, queryFilter } : {},
            selectedIds: formData.scope.scopeType === 'manual-selection' ? { required } : {},
          }),
        },
      },
      review: {},
    })

  const availableActions = computed(() => getResourceActions(formData.details.resource))

  const effectOptions = computed(() => [
    { id: 'allow', label: t('allow'), value: 'allow' as const },
    { id: 'deny', label: t('deny'), value: 'deny' as const },
  ])

  const { id: resourceSelectId } = useFormSelect('resource', PRIVILEGE_RESOURCES, {
    required: true,
    searchable: true,
  })

  const { id: actionsSelectId } = useFormSelect('actions', availableActions, {
    required: true,
    multiple: true,
    searchable: true,
    disabled: () => formData.details.resource === undefined,
  })

  const { id: effectSelectId } = useFormSelect('effect', effectOptions, {
    required: true,
    option: { label: 'label', value: 'value' },
  })

  const selectableResource = computed(() => {
    const { resource } = formData.details

    return resource !== undefined && isSelectablePrivilegeResource(resource) ? resource : undefined
  })

  const availableScopeTypes = computed(() => getAvailablePrivilegeScopeTypes(formData.details.resource))

  const selectorSchema = usePrivilegeSelectorSchema(selectableResource)

  const selectorField = useField('selector')

  const selectorError = computed(() => getErrorContent(selectorField.value.error))

  const selectedIdsField = useField('selectedIds')

  const selectedIdsError = computed(() => getErrorContent(selectedIdsField.value.error))

  const appliedSelector = ref(formData.scope.selector)

  function applySelector() {
    appliedSelector.value = formData.scope.selector
  }

  watch(currentStep, () => applySelector())

  const isSelectorPreviewEnabled = computed(
    () =>
      formData.scope.scopeType === 'dynamic-selection' &&
      selectableResource.value !== undefined &&
      appliedSelector.value !== '' &&
      queryFilter.exec(appliedSelector.value)
  )

  const {
    matches: selectorMatches,
    isReady: areSelectorMatchesReady,
    hasError: hasSelectorMatchesError,
  } = usePrivilegeSelectorMatches({
    resource: selectableResource,
    selector: appliedSelector,
    isEnabled: isSelectorPreviewEnabled,
  })

  // The available actions, the properties a selector can be built on and the selectable objects all
  // depend on the resource, so a resource change invalidates them.
  watch(
    () => formData.details.resource,
    () => {
      if (formData.details.actions.length > 0) {
        formData.details.actions = []
      }

      formData.scope.selector = ''
      applySelector()

      if (!availableScopeTypes.value.includes(formData.scope.scopeType)) {
        formData.scope.scopeType = 'all-objects'
      }

      if (formData.scope.selectedIds.length > 0) {
        formData.scope.selectedIds = []
      }
    }
  )

  function buildSelector() {
    if (formData.scope.scopeType === 'manual-selection') {
      return buildManualSelectionSelector(formData.scope.selectedIds)
    }

    if (formData.scope.scopeType === 'dynamic-selection') {
      return formData.scope.selector
    }

    return undefined
  }

  async function validateAndBuildPayloads(): Promise<NewPrivilegePayload[] | undefined> {
    const isValid = await validateAllSteps()

    const { resource, actions, effect } = formData.details

    if (!isValid || resource === undefined) {
      return undefined
    }

    const selector = buildSelector()

    // A privilege carries a single action, so a multi-action selection yields one privilege per action.
    return actions.map((action: PrivilegeAction) => ({ resource, action, effect, selector }))
  }

  return {
    formData,
    currentStep,
    next,
    back,
    backTo,
    resourceSelectBindings: useSelect(resourceSelectId, () => ({ label: t('privilege:resource') })),
    actionsSelectBindings: useSelect(actionsSelectId, () => ({
      label: t('privilege:action'),
      info: t('privilege:one-privilege-per-action'),
    })),
    effectSelectBindings: useSelect(effectSelectId, () => ({ label: t('privilege:effect') })),
    selectableResource,
    availableScopeTypes,
    selectorSchema,
    selectorError,
    applySelector,
    selectedIdsError,
    isSelectorPreviewEnabled,
    selectorMatches,
    areSelectorMatchesReady,
    hasSelectorMatchesError,
    validateAndBuildPayloads,
  }
}
