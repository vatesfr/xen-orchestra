import { useV2vLaunchOptionSelection } from '@/modules/v2v/composables/use-v2v-launch-option-selection.composable.ts'
import { useV2vVmLabels } from '@/modules/v2v/composables/use-v2v-vm-labels.composable.ts'
import { useFormSelect } from '@core/packages/form-select'
import { type MaybeRefOrGetter, type Ref, toValue } from 'vue'

// `undefined` follows the default value
export function useV2vLaunchOptionSelect(model: Ref<boolean | undefined>, defaultValue: MaybeRefOrGetter<boolean>) {
  const { getLaunchOptionLabel } = useV2vVmLabels()

  return useFormSelect([true, false], {
    model: useV2vLaunchOptionSelection(model),
    emptyOption: () => ({ value: undefined, label: getLaunchOptionLabel(undefined, toValue(defaultValue)) }),
    option: {
      id: value => String(value),
      label: value => getLaunchOptionLabel(value, toValue(defaultValue)),
    },
  })
}
