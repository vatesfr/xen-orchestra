export function getOptionLabel<TValue>(options: { label: string; value: TValue }[], value: TValue): string | undefined {
  return options.find(option => option.value === value)?.label
}

export function getSelectedLabels({
  options,
  modelValue,
}: {
  options: { label: string; value: number }[]
  modelValue: number[]
}): string | undefined {
  return modelValue.length === 0
    ? undefined
    : options
        .filter(option => modelValue.includes(option.value))
        .map(option => option.label)
        .join(', ')
}
