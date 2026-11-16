import { useV2vLaunchOptionSelect } from '@/modules/v2v/composables/use-v2v-launch-option-select.composable.ts'
import { useV2vReviewLabels } from '@/modules/v2v/composables/use-v2v-review-labels.composable.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { flushPromises } from '@vue/test-utils'
import { ref } from 'vue'

function mountSelect(modelValue: boolean | undefined, initialDefaultValue = true) {
  const model = ref(modelValue)
  const defaultValue = ref(initialDefaultValue)

  const { wrapper } = mountComposable(() => {
    const { allOptions, selectedLabel } = useV2vLaunchOptionSelect(model, defaultValue)

    return { allOptions, selectedLabel, labels: useV2vReviewLabels() }
  })

  return { vm: wrapper.vm, model, defaultValue }
}

describe('allOptions', () => {
  it.each([true, false])('offers the default of %s, then the other value', defaultValue => {
    const { vm } = mountSelect(undefined, defaultValue)

    expect(vm.allOptions.map(({ properties: { value, label } }) => ({ value, label }))).toEqual([
      { value: undefined, label: vm.labels.getLaunchOptionLabel(undefined, defaultValue) },
      { value: !defaultValue, label: vm.labels.getLaunchOptionLabel(!defaultValue, defaultValue) },
    ])
  })
})

describe('selectedLabel', () => {
  it.each([true, false])('shows an option set to %s as that value', value => {
    const { vm } = mountSelect(value, !value)

    expect(vm.selectedLabel).toBe(vm.labels.getLaunchOptionLabel(value, !value))
  })

  // The select starts on a default of true, then the default takes each of `defaultValues`
  it.each([
    { value: undefined, defaultValues: [] },
    { value: undefined, defaultValues: [false] },
    { value: false, defaultValues: [false] },
    { value: false, defaultValues: [false, true] },
  ])(
    'shows an option set to $value as the default, then leaves it to the default, after the defaults $defaultValues',
    async ({ value, defaultValues }) => {
      const { vm, model, defaultValue } = mountSelect(value)

      for (const nextDefaultValue of defaultValues) {
        defaultValue.value = nextDefaultValue
        await flushPromises()
      }

      expect(vm.selectedLabel).toBe(vm.labels.getLaunchOptionLabel(undefined, defaultValue.value))
      expect(model.value).toBeUndefined()
    }
  )
})
