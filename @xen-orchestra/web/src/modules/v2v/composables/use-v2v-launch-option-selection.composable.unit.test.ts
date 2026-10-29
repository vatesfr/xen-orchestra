import { useV2vLaunchOptionSelection } from '@/modules/v2v/composables/use-v2v-launch-option-selection.composable.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { flushPromises } from '@vue/test-utils'
import { computed, ref } from 'vue'

// A model bound like a parent does: `keepsPicks` false clears every value picked, as a pick of the default value
function mountSelection(initialValue: boolean | undefined, keepsPicks = true) {
  const value = ref(initialValue)
  const picks: (boolean | undefined)[] = []

  const model = computed({
    get: () => value.value,
    set: picked => {
      picks.push(picked)

      if (keepsPicks) {
        value.value = picked
      }
    },
  })

  const { wrapper } = mountComposable(() => ({ selection: useV2vLaunchOptionSelection(model) }))

  return { vm: wrapper.vm, value, picks }
}

it('selects the value of its model', () => {
  expect(mountSelection(false).vm.selection).toBe(false)
})

it('follows its model when it changes', async () => {
  const { vm, value, picks } = mountSelection(undefined)

  value.value = true
  await flushPromises()

  expect(vm.selection).toBe(true)
  expect(picks).toEqual([])
})

it('keeps a value picked once its model takes it', async () => {
  const { vm, picks } = mountSelection(undefined)

  vm.selection = false
  await flushPromises()

  expect(vm.selection).toBe(false)
  expect(picks).toEqual([false])
})

it('goes back to its model when the model does not keep the value picked', async () => {
  const { vm, picks } = mountSelection(undefined, false)

  vm.selection = true
  await flushPromises()

  expect(vm.selection).toBeUndefined()
  expect(picks).toEqual([true])
})
