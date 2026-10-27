// Keeps the values shared by all the BRs form data, and lists the fields whose values differ
export function mergeValues<TFormData extends Record<string, unknown>>(
  brsFormData: TFormData[],
  mixedValue: string,
  textFields?: (keyof TFormData)[]
) {
  const mergedData: Partial<Record<keyof TFormData, unknown>> = {}
  const mixedFields: (keyof TFormData)[] = []

  for (const field of Object.keys(brsFormData[0] ?? {}) as (keyof TFormData)[]) {
    const values = brsFormData.map(formData => formData[field])

    if (new Set(values).size === 1) {
      mergedData[field] = values[0]
      continue
    }

    mixedFields.push(field)

    const isTextField = textFields?.includes(field) ?? typeof values[0] === 'string'

    mergedData[field] = isTextField ? mixedValue : undefined
  }

  return { data: mergedData as Partial<TFormData>, mixedFields }
}

// Keeps the values to apply to all the items: the ones left mixed don't change on each item
export function omitMixedValues(formData: Record<string, unknown>, mixedValue: string) {
  return Object.fromEntries(Object.entries(formData).filter(([, value]) => value !== mixedValue && value !== undefined))
}
