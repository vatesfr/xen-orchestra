const uniqueIds = new Map<string | undefined, number>()

export const uniqueId = (prefix?: string) => {
  const id = uniqueIds.get(prefix) || 0
  uniqueIds.set(prefix, id + 1)

  return prefix !== undefined ? `${prefix}-${id}` : `${id}`
}
