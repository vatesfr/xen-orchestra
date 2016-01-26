import filter from 'lodash.filter'
import map from 'lodash.map'
import trim from 'lodash.trim'

const sanitizePath = (...paths) => filter(map(paths, s => s && filter(map(s.split('/'), trim)).join('/'))).join('/')

export const parse = (remote) => {
  const [type, rest] = remote.url.split('://')
  if (type === 'file') {
    remote.type = 'local'
    remote.path = `/${rest}` // FIXME the heading slash has been forgotten on client side first implementation
  } else if (type === 'nfs') {
    remote.type = 'nfs'
    const [host, share] = rest.split(':')
    remote.path = `/tmp/xo-server/mounts/${remote.id}`
    remote.host = host
    remote.share = share
  } else if (type === 'smb') {
    remote.type = 'smb'
    const [auth, smb] = rest.split('@')
    const [username, password] = auth.split(':')
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
    type === 'smb' && (path = `/${path}`) // FIXME file type should have a / too, but it has been forgotten on client side first implementation...
  }
  url += path
  return url
}
