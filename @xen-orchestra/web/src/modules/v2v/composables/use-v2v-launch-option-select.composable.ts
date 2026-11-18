import { useV2vReviewLabels } from '@/modules/v2v/composables/use-v2v-review-labels.composable.ts'
import { getV2vOverride } from '@/modules/v2v/utils/v2v-mapping.util.ts'
import { useFormSelect } from '@core/packages/form-select'
import { computed, type MaybeRefOrGetter, type Ref, toValue } from 'vue'

// `undefined` follows the default value: only the other value is offered beside it, so the parent keeps every pick.
// A value the default has since taken reads as that default
export function useV2vLaunchOptionSelect(model: Ref<boolean | undefined>, defaultValue: MaybeRefOrGetter<boolean>) {
  const { getLaunchOptionLabel } = useV2vReviewLabels()

  const selection = computed({
    get: () => getV2vOverride(model.value, toValue(defaultValue)),
    set: value => {
      model.value = value
    },
  })

  return useFormSelect(() => [!toValue(defaultValue)], {
    model: selection,
    emptyOption: () => ({ value: undefined, label: getLaunchOptionLabel(undefined, toValue(defaultValue)) }),
    option: {
      id: value => String(value),
      label: value => getLaunchOptionLabel(value, toValue(defaultValue)),
    },
  })
}
