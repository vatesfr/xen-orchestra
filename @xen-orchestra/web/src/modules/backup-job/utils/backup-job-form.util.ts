export type BackupJobFormOption<TValue> = { label: string; value: TValue; description?: string; disabled?: boolean }

export function formatOptionLabel<TValue>(options: BackupJobFormOption<TValue>[], value: TValue): string | undefined {
  return options.find(option => option.value === value)?.label
}

export function formatSelectedLabels(options: BackupJobFormOption<number>[], values: number[]): string | undefined {
  return values.length === 0
    ? undefined
    : options
        .filter(option => values.includes(option.value))
        .map(option => option.label)
        .join(', ')
}
