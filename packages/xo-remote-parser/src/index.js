import filter from 'lodash/filter'
import map from 'lodash/map'
import trim from 'lodash/trim'
import trimStart from 'lodash/trimStart'
import urlParser from 'url-parse'

const NFS_RE = /^([^:]+):(?:(\d+):)?([^:]+)$/
const SMB_RE = /^([^:]+):(.+)@([^@]+)\\\\([^\0]+)(?:\0(.*))?$/

const sanitizePath = (...paths) => filter(map(paths, s => s && filter(map(s.split('/'), trim)).join('/'))).join('/')

export const parse = string => {
  const object = {}

  const [type, rest] = string.split('://')
  if (type === 'file') {
    object.type = 'file'
    object.path = `/${trimStart(rest, '/')}` // the leading slash has been forgotten on client side first implementation
  } else if (type === 'nfs') {
    object.type = 'nfs'
    let host, port, path
    // Some users have a remote with a colon in the URL, which breaks the parsing since this commit: https://github.com/vatesfr/xen-orchestra/commit/fb1bf6a1e748b457f2d2b89ba02fa104554c03df
    try {
      ;[, host, port, path] = NFS_RE.exec(rest)
    } catch (err) {
      ;[host, path] = rest.split(':')
      object.invalidUrl = true
    }
    object.host = host
    object.port = port
    object.path = `/${trimStart(path, '/')}` // takes care of a missing leading slash coming from previous version format
  } else if (type === 'smb') {
    object.type = 'smb'
    const [, username, password, domain, host, path = ''] = SMB_RE.exec(rest)
    object.host = host
    object.path = path
    object.domain = domain
    object.username = username
    object.password = password
  } else if (type === 's3' || type === 's3+http') {
    const parsed = urlParser(string, true)
    object.protocol = parsed.protocol === 's3:' ? 'https' : 'http'
    object.type = 's3'
    object.region = parsed.hash.length === 0 ? undefined : parsed.hash.slice(1) // remove '#'
    object.host = parsed.host
    object.path = parsed.pathname
    object.username = parsed.username
    object.password = decodeURIComponent(parsed.password)
    const qs = parsed.query
    object.acceptSelfSigned = qs.acceptSelfSigned === 'true'
  }
  return object
}

export const format = ({
  type,
  host,
  path,
  port,
  username,
  password,
  domain,
  protocol = type,
  region,
  acceptSelfSigned = false,
}) => {
  type === 'local' && (type = 'file')
  let string = `${type}://`
  if (type === 'nfs') {
    string += `${host}:${port !== undefined ? port + ':' : ''}`
  }
  if (type === 'smb') {
    string += `${username}:${password}@${domain}\\\\${host}`
  }
  if (type === 's3') {
    string = protocol === 'https' ? 's3://' : 's3+http://'
    string += `${username}:${encodeURIComponent(password)}@${host}`
  }
  path = sanitizePath(path)
  if (type === 'smb') {
    path = path.split('/')
    path = '\0' + path.join('\\') // FIXME saving with the windows fashion \ was a bad idea :,(
  } else {
    path = `/${path}`
  }
  string += path

  if (type === 's3') {
    string += `?acceptSelfSigned=${acceptSelfSigned}`
  }
  if (type === 's3' && region !== undefined) {
    string += `#${region}`
  }
  return string
}
