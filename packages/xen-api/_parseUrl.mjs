const URL_RE = /^(?:(https?:)\/*)?(?:(([^:]*)(?::([^@]*))?)@)?(\[[^\]]+\]|[^:/]+)(?::([0-9]+))?(\/[^?#]*)?$/

export default url => {
  const matches = URL_RE.exec(url)
  if (matches === null) {
    throw new Error('invalid URL: ' + url)
  }

  const [, protocol = 'https:', auth, username = '', password = '', hostname, port, pathname = '/'] = matches
  const parsedUrl = {
    protocol,
    hostname,
    port,
    pathname,

    // compat with url.parse
    auth,
  }
  if (username !== '') {
    parsedUrl.username = decodeURIComponent(username)
  }
  if (password !== '') {
    parsedUrl.password = decodeURIComponent(password)
  }
  return parsedUrl
}
