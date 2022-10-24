const RE = /^\s*basic\s+(.+?)\s*$/i

export function parseBasicAuth(header) {
  if (header === undefined) {
    return
  }

  const matches = RE.exec(header)
  if (matches === null) {
    return
  }

  let credentials = Buffer.from(matches[1], 'base64').toString()

  const i = credentials.indexOf(':')
  if (i === -1) {
    credentials = { token: credentials }
  } else if (i === credentials.length - 1) {
    credentials = { token: credentials.slice(0, i) }
  } else {
    // https://datatracker.ietf.org/doc/html/rfc3986#section-3.2.1
    credentials = {
      username: credentials.slice(0, i),
      password: credentials.slice(i + 1),
    }
  }

  return credentials
}
