export type ScopedTag = {
  key: string
  value: string
}

export function parseScopedTag(tag: string): ScopedTag | null {
  const separatorIndex = tag.indexOf('=')

  if (separatorIndex === -1) {
    return null
  }

  return {
    key: tag.slice(0, separatorIndex),
    value: tag.slice(separatorIndex + 1),
  }
}
