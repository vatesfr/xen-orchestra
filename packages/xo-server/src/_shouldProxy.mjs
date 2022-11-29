import splitHost from 'split-host'

// https://about.gitlab.com/blog/2021/01/27/we-need-to-talk-no-proxy/
export function shouldProxy(host, { NO_PROXY, no_proxy = NO_PROXY } = process.env) {
  if (no_proxy == null) {
    return true
  }
  if (no_proxy === '*') {
    return false
  }

  const { hostname } = splitHost(host)

  for (let entry of no_proxy.split(',')) {
    entry = entry.trim()
    if (entry[0] === '.') {
      entry = entry.slice(1)
    }

    entry = splitHost(entry.trim())

    console.log(hostname, entry.hostname)
    if (hostname.endsWith(entry.hostname)) {
      return false
    }
  }
  return true
}
