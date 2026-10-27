import { computed, type MaybeRefOrGetter, type Ref, toValue } from 'vue'

function hasValue(value: unknown) {
  return value !== undefined && value !== null
}

export function useOptionalValue(
  model: Ref<unknown>,
  { required, createValue }: { required: MaybeRefOrGetter<boolean | undefined>; createValue: () => unknown }
) {
  return computed({
    get: () => toValue(required) === true || hasValue(model.value),
    set: value => {
      model.value = value ? (model.value ?? createValue()) : undefined
    },
  })
}
