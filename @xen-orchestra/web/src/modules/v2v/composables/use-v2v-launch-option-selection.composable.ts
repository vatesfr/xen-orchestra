import { nextTick, ref, watch, type Ref } from 'vue'

// What a launch option select shows goes back to its model when the parent does not keep the value picked: picking
// the default value leaves the option on its default
export function useV2vLaunchOptionSelection(model: Ref<boolean | undefined>) {
  const selection = ref<boolean>()

  watch(
    model,
    value => {
      selection.value = value
    },
    { immediate: true }
  )

  watch(selection, async value => {
    if (value === model.value) {
      return
    }

    model.value = value
    await nextTick()
    selection.value = model.value
  })

  return selection
}
