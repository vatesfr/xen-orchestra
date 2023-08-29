const OPAQUE_REF_RE = /OpaqueRef:[0-9a-z-]+/

export default function extractOpaqueRef(str) {
  const matches = OPAQUE_REF_RE.exec(str)
  if (!matches) {
    const error = new Error('no opaque ref found')
    error.haystack = str
    throw error
  }
  return matches[0]
}
