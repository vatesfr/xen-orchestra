import { useV2vLaunchOptionSelect } from '@/modules/v2v/composables/use-v2v-launch-option-select.composable.ts'
import { useV2vVmLabels } from '@/modules/v2v/composables/use-v2v-vm-labels.composable.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { flushPromises } from '@vue/test-utils'
import { ref } from 'vue'

function mountSelect(modelValue: boolean | undefined, initialDefaultValue = true) {
  const model = ref(modelValue)
  const defaultValue = ref(initialDefaultValue)

  const { wrapper } = mountComposable(() => {
    const { allOptions, selectedLabel } = useV2vLaunchOptionSelect(model, defaultValue)

    return { allOptions, selectedLabel, labels: useV2vVmLabels() }
  })

  return { vm: wrapper.vm, defaultValue }
}

describe('allOptions', () => {
  it('offers the default, on, then off', () => {
    const { vm } = mountSelect(undefined)

    expect(vm.allOptions.map(({ properties: { value, label } }) => ({ value, label }))).toEqual([
      { value: undefined, label: vm.labels.getLaunchOptionLabel(undefined, true) },
      { value: true, label: vm.labels.getLaunchOptionLabel(true, true) },
      { value: false, label: vm.labels.getLaunchOptionLabel(false, true) },
    ])
  })
})

describe('selectedLabel', () => {
  it.each([true, false])('shows an option following its default of %s as that default', defaultValue => {
    const { vm } = mountSelect(undefined, defaultValue)

    expect(vm.selectedLabel).toBe(vm.labels.getLaunchOptionLabel(undefined, defaultValue))
  })

  it.each([true, false])('shows an option set to %s as that value', value => {
    const { vm } = mountSelect(value, !value)

    expect(vm.selectedLabel).toBe(vm.labels.getLaunchOptionLabel(value, !value))
  })

  it('follows a default that changes', async () => {
    const { vm, defaultValue } = mountSelect(undefined)

    defaultValue.value = false
    await flushPromises()

    expect(vm.selectedLabel).toBe(vm.labels.getLaunchOptionLabel(undefined, false))
  })
})
