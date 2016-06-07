import filter from 'lodash/filter'
import map from 'lodash/map'
import trim from 'lodash/trim'
import trimStart from 'lodash/trimStart'

const sanitizePath = (...paths) => filter(map(paths, s => s && filter(map(s.split('/'), trim)).join('/'))).join('/')

export const parse = remote => {
  const [type, rest] = remote.url.split('://')
  if (type === 'file') {
    remote.type = 'local'
    remote.path = `/${trimStart(rest, '/')}` // the leading slash has been forgotten on client side first implementation
  } else if (type === 'nfs') {
    remote.type = 'nfs'
    const [host, share] = rest.split(':')
    remote.path = `/tmp/xo-server/mounts/${remote.id}`
    remote.host = host
    remote.share = share
  } else if (type === 'smb') {
    remote.type = 'smb'
    const lastAtSign = rest.lastIndexOf('@')
    const smb = rest.slice(lastAtSign + 1)
    const auth = rest.slice(0, lastAtSign)
    const firstColon = auth.indexOf(':')
    const username = auth.slice(0, firstColon)
    const password = auth.slice(firstColon + 1)
    const [domain, sh] = smb.split('\\\\')
    const [host, path] = sh.split('\0')
    remote.host = host
    remote.path = path
    remote.domain = domain
    remote.username = username
    remote.password = password
  }
  return remote
}

export const format = ({type, host, path, username, password, domain}) => {
  type === 'local' && (type = 'file')
  let url = `${type}://`
  if (type === 'nfs') {
    url += `${host}:`
  }
  if (type === 'smb') {
    url += `${username}:${password}@${domain}\\\\${host}`
  }
  path = sanitizePath(path)
  if (type === 'smb') {
    path = path.split('/')
    path = '\0' + path.join('\\') // FIXME saving with the windows fashion \ was a bad idea :,(
  } else {
    type === 'file' && (path = `/${path}`)
  }
  url += path
  return url
}
