import filter from 'lodash/filter'
import map from 'lodash/map'
import trim from 'lodash/trim'
import trimStart from 'lodash/trimStart'
import urlParser from 'url-parse'

const zlib = require('zlib')

const NFS_RE = /^([^:]+):(?:(\d+):)?([^:?]+)(\?[^?]*)?$/
const SMB_RE = /^([^:]+):(.+)@([^@]+)\\\\([^\0?]+)(?:\0([^?]*))?(\?[^?]*)?$/

const AUTHORIZED_OPTIONS = {
  // common options
  default: {
    useVhdDirectory: {
      type: 'boolean',
      default: false,
    },
    compressionType: {
      type: 'string',
      default: 'none',
    },
  },
  // by remote type options
  file: {},
  nfs: {},
  smb: {},
  s3: {
    allowUnauthorized: {
      type: 'boolean',
      default: false,
    },
    compressionType: {
      type: 'string',
      default: 'gzip',
    },
    compressionOptions: {
      type: 'object',
      default: {
        level: zlib.constants.Z_BEST_SPEED,
      },
    },
    useVhdDirectory: {
      type: 'boolean',
      default: true,
    },
  },
}

const sanitizePath = (...paths) => filter(map(paths, s => s && filter(map(s.split('/'), trim)).join('/'))).join('/')

const parseOptionList = (remoteType, optionList = '') => {
  const parsed = {}
  optionList
    .split('&')
    .filter(v => !!v)
    .map(keyVal => keyVal.split('='))
    .map(([key, val]) => (parsed[key] = decodeURIComponent(val)))

  return filterOptions(remoteType, parsed)
}

const filterOptions = (remoteType, rawOptions) => {
  const authorizedOptions = { ...AUTHORIZED_OPTIONS.default, ...AUTHORIZED_OPTIONS[remoteType] }
  const options = {}

  Object.keys(rawOptions).forEach(key => {
    const val = rawOptions[key]
    const authorizedOption = authorizedOptions[key]
    if (authorizedOption !== undefined) {
      switch (authorizedOption.type) {
        case 'boolean':
          options[key] = val === '' ? authorizedOption.default : val === 'true'
          break
        case 'string':
          options[key] = val === '' ? authorizedOption.default : val
          break
        case 'object':
          options[key] = val === '' ? authorizedOption.default : JSON.parse(val)
          break
        default:
          throw new Error(`can't handle option of type ${authorizedOption.type} for key ${key}`)
      }
    }
  })
  return options
}

const makeOptionList = (remoteType, options) => {
  const authorizedOptions = { ...AUTHORIZED_OPTIONS.default, ...AUTHORIZED_OPTIONS[remoteType] }
  const list = []
  for (const authorizedOptionKey of Object.keys(authorizedOptions)) {
    const authorizedOption = authorizedOptions[authorizedOptionKey]
    if (options[authorizedOptionKey] === undefined) {
      // @todo : should I return the default value ? that way the remote url will be explicit
      continue
    }
    const val = options[authorizedOptionKey] ?? authorizedOption.default
    switch (authorizedOption.type) {
      case 'boolean':
        list.push(`${authorizedOptionKey}=${val === true ? 'true' : 'false'}`)
        break
      case 'string':
        list.push(`${authorizedOptionKey}=${encodeURIComponent(val)}`)
        break
      case 'object':
        list.push(`${authorizedOptionKey}=${encodeURIComponent(JSON.stringify(val))}`)
        break
      default:
        throw new Error(`can't handle option of type ${authorizedOption.type} for key ${authorizedOptionKey}`)
    }
    list[authorizedOptionKey] = encodeURIComponent(list[authorizedOptionKey])
  }
  return list.join('&')
}

export const parse = string => {
  let object = {}
  let [type, rest] = string.split('://')
  if (type === 'file') {
    object.type = 'file'
    let optionList
    ;[rest, optionList] = rest.split('?')
    object.path = `/${trimStart(rest, '/')}` // the leading slash has been forgotten on client side first implementation
    object = { ...parseOptionList('file', optionList), ...object }
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
    // remove the ? at the begininng of options
    object = { ...parseOptionList('nfs', optionList?.substring(1)), ...object }
  } else if (type === 'smb') {
    object.type = 'smb'
    const [, username, password, domain, host, path = '', optionList] = SMB_RE.exec(rest)
    object.host = host
    object.path = path
    object.domain = domain
    object.username = username
    object.password = password
    // remove the ? at the begininng of options
    object = { ...parseOptionList('smb', optionList?.substring(1)), ...object }
  } else if (type === 's3' || type === 's3+http') {
    const parsed = urlParser(string, true)
    object.protocol = parsed.protocol === 's3:' ? 'https' : 'http'
    object.type = 's3'
    object.region = parsed.hash.length === 0 ? undefined : parsed.hash.slice(1) // remove '#'
    object.host = parsed.host
    object.path = parsed.pathname
    object.username = parsed.username
    object.password = decodeURIComponent(parsed.password)

    object = { ...filterOptions('s3', parsed.query), ...object }
  }
  return object
}

export const format = parameters => {
  let { type, host, path, port, username, password, domain, protocol = type, region } = parameters
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

  const optionsList = makeOptionList(type, parameters)

  if (optionsList !== '') {
    string += '?' + optionsList
  }
  if (type === 's3' && region !== undefined) {
    string += `#${region}`
  }
  return string
}
