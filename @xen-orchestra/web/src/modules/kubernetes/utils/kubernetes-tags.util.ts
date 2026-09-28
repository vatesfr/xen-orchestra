export function kubernetesTagsToStrings(tags: Record<string, string> | null): string[] {
  if (tags === null) {
    return []
  }

  return Object.entries(tags).map(([key, value]) => (value === '' ? key : `${key}: ${value}`))
}

function parseKubernetesTagPart(part: string): string {
  const trimmed = part.trim()

  if (trimmed === '' || part !== trimmed || /\s/.test(trimmed)) {
    throw new Error('invalid-kubernetes-tags')
  }

  return trimmed
}

export function parseKubernetesTagsString(tagsRaw: string): Record<string, string> | undefined {
  const trimmed = tagsRaw.trim()

  if (trimmed === '') {
    return undefined
  }

  const tags: Record<string, string> = {}

  for (const part of trimmed.split(',')) {
    const pair = part.trim()

    if (pair === '') {
      continue
    }

    const equalSignIndex = pair.indexOf('=')

    if (equalSignIndex === -1) {
      throw new Error('invalid-kubernetes-tags')
    }

    const key = parseKubernetesTagPart(pair.slice(0, equalSignIndex))
    const value = parseKubernetesTagPart(pair.slice(equalSignIndex + 1))

    tags[key] = value
  }

  return Object.keys(tags).length === 0 ? undefined : tags
}

export function isValidKubernetesTagsString(tagsRaw: string): boolean {
  try {
    parseKubernetesTagsString(tagsRaw)

    return true
  } catch {
    return false
  }
}
