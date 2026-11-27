/**
 * Extracts the credentials from the base64 payload of a `Authorization: Basic` header.
 *
 * Per RFC 7617 §2, the user-id cannot contain a colon but the password can: split on the
 * first colon only and keep the remainder as the password.
 */
export function parseBasicCredentials(encoded: string): { username: string; password: string | undefined } {
  const decoded = Buffer.from(encoded, 'base64').toString()
  const index = decoded.indexOf(':')
  if (index === -1) {
    return { username: decoded, password: undefined }
  }
  return { username: decoded.slice(0, index), password: decoded.slice(index + 1) }
}
