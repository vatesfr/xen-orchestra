export function normalizeKubernetesTags(tags: unknown): Record<string, string> | null {
  if (tags === null || tags === undefined) {
    return null
  }

  if (typeof tags !== 'object' || Array.isArray(tags)) {
    return null
  }

  const normalizedTags = Object.fromEntries(
    Object.entries(tags).filter(
      (entry): entry is [string, string] => typeof entry[0] === 'string' && typeof entry[1] === 'string'
    )
  )

  return Object.keys(normalizedTags).length === 0 ? null : normalizedTags
}

export function kubernetesTagsToDisplayStrings(tags: Record<string, string> | null): string[] {
  if (tags === null) {
    return []
  }

  return Object.entries(tags).map(([key, value]) => (value === '' ? key : `${key}: ${value}`))
}
