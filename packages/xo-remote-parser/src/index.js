import filter from 'lodash/filter'
import map from 'lodash/map'
import trim from 'lodash/trim'
import trimStart from 'lodash/trimStart'
import queryString from 'querystring'
import { URL } from 'url'

const NFS_RE = /^([^:]+):(?:(\d+):)?([^:?]+)(\?[^?]*)?$/
const SMB_RE = /^([^:]+):(.+)@([^@]+)\\\\([^\0?]+)(?:\0([^?]*))?(\?[^?]*)?$/

const sanitizePath = (...paths) => filter(map(paths, s => s && filter(map(s.split('/'), trim)).join('/'))).join('/')

const parseOptionList = (optionList = '') => {
  if (optionList?.startsWith('?')) {
    optionList = optionList.substring(1)
  }
  const parsed = queryString.parse(optionList)
  Object.keys(parsed).forEach(key => {
    const val = parsed[key]
    parsed[key] = val === 'true' ? true : val === 'false' ? false : JSON.parse(val)
  })
  return parsed
}

const makeOptionList = options => {
  const encoded = {}

  Object.keys(options).forEach(key => {
    const val = options[key]
    encoded[key] = val === 'true' || val === 'false' ? val : JSON.stringify(val)
  })
  return queryString.stringify(encoded)
}

export const parse = string => {
  let object = {}
  let [type, rest] = string.split('://')
  if (type === 'file') {
    object.type = 'file'
    let optionList
    ;[rest, optionList] = rest.split('?')
    object.path = `/${trimStart(rest, '/')}` // the leading slash has been forgotten on client side first implementation
    object = { ...parseOptionList(optionList), ...object }
  } else if (type === 'nfs') {
    object.type = 'nfs'
    let host, port, path, optionList
    // Some users have a remote with a colon in the URL, which breaks the parsing since this commit: https://github.com/vatesfr/xen-orchestra/commit/fb1bf6a1e748b457f2d2b89ba02fa104554c03df
    try {
      ;[, host, port, path, optionList] = NFS_RE.exec(rest)
    } catch (err) {
      ;[host, path] = rest.split(':')
      object.invalidUrl = true
    }
    object.host = host
    object.port = port
    object.path = `/${trimStart(path, '/')}` // takes care of a missing leading slash coming from previous version format
    object = { ...parseOptionList(optionList), ...object }
  } else if (type === 'smb') {
    object.type = 'smb'
    const [, username, password, domain, host, path = '', optionList] = SMB_RE.exec(rest)
    object.host = host
    object.path = path
    object.domain = domain
    object.username = username
    object.password = password
    object = { ...parseOptionList(optionList), ...object }
  } else if (type === 's3' || type === 's3+http') {
    // @todo : not supported until node 6.13.0 , is ok ?
    const parsed = new URL(string)
    object.protocol = parsed.protocol === 's3:' ? 'https' : 'http'
    object.type = 's3'
    object.region = parsed.hash.length === 0 ? undefined : parsed.hash.slice(1) // remove '#'
    object.host = parsed.host
    object.path = parsed.pathname
    object.username = parsed.username
    object.password = decodeURIComponent(parsed.password)
    object = { ...parseOptionList(parsed.search), ...object }
  }
  return object
}

export const format = ({ type, host, path, port, username, password, domain, protocol = type, region, ...options }) => {
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

  const optionsList = makeOptionList(options)

  if (optionsList !== '') {
    string += '?' + optionsList
  }
  if (type === 's3' && region !== undefined) {
    string += `#${region}`
  }
  return string
}
