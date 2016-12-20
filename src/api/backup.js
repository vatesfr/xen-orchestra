import { basename } from 'path'
import { format } from 'json-rpc-peer'

// ===================================================================

export function list ({ remote }) {
  return this.listVmBackups(remote)
}

list.permission = 'admin'
list.params = {
  remote: { type: 'string' }
}

// -------------------------------------------------------------------

export function scanDisk ({ remote, disk }) {
  return this.scanDiskBackup(remote, disk)
}

scanDisk.permission = 'admin'
scanDisk.params = {
  remote: { type: 'string' },
  disk: { type: 'string' }
}

// -------------------------------------------------------------------

export function scanFiles ({ remote, disk, partition, path }) {
  return this.scanFilesInDiskBackup(remote, disk, partition, path)
}

scanFiles.permission = 'admin'
scanFiles.params = {
  remote: { type: 'string' },
  disk: { type: 'string' },
  partition: { type: 'string', optional: true },
  path: { type: 'string' }
}

// -------------------------------------------------------------------

function handleFetchFiles (req, res, { remote, disk, partition, paths }) {
  this.fetchFilesInDiskBackup(remote, disk, partition, paths).then(files => {
    res.setHeader('content-disposition', 'attachment')
    res.setHeader('content-type', 'application/octet-stream')
    files[0].pipe(res)
  }).catch(error => {
    console.error(error)
    res.writeHead(500)
    res.end(format.error(0, error))
  })
}

export async function fetchFiles (params) {
  return this.registerHttpRequest(handleFetchFiles, params, {
    suffix: `/${basename(params.paths[0])}`
  }).then(url => ({ $getFrom: url }))
}

fetchFiles.permission = 'admin'
fetchFiles.params = {
  remote: { type: 'string' },
  disk: { type: 'string' },
  partition: { type: 'string', optional: true },
  paths: {
    type: 'array',
    items: { type: 'string' },
    minLength: 1,
    maxLength: 1 // TODO: remove when able to tar
  }
}
