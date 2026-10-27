export function getOptionLabel<TValue>(options: { label: string; value: TValue }[], value: TValue): string | undefined {
  return options.find(option => option.value === value)?.label
}
