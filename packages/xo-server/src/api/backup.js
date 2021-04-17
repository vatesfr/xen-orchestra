import archiver from 'archiver'
import createLogger from '@xen-orchestra/log'
import { basename } from 'path'
import { format } from 'json-rpc-peer'
import { forEach } from 'lodash'

const log = createLogger('xo:backup')

// ===================================================================

export function list({ remote }) {
  return this.listVmBackups(remote)
}

list.permission = 'admin'
list.params = {
  remote: { type: 'string' },
}

// -------------------------------------------------------------------

export function scanDisk({ remote, disk }) {
  return this.scanDiskBackup(remote, disk)
}

scanDisk.permission = 'admin'
scanDisk.params = {
  remote: { type: 'string' },
  disk: { type: 'string' },
}

// -------------------------------------------------------------------

export function scanFiles({ remote, disk, partition, path }) {
  return this.scanFilesInDiskBackup(remote, disk, partition, path)
}

scanFiles.permission = 'admin'
scanFiles.params = {
  remote: { type: 'string' },
  disk: { type: 'string' },
  partition: { type: 'string', optional: true },
  path: { type: 'string' },
}

// -------------------------------------------------------------------

function handleFetchFiles(req, res, { remote, disk, partition, paths, format: archiveFormat }) {
  return this.fetchFilesInDiskBackup(remote, disk, partition, paths).then(files => {
    res.setHeader('content-disposition', 'attachment')
    res.setHeader('content-type', 'application/octet-stream')

    const nFiles = paths.length

    // Send lone file directly
    if (nFiles === 1) {
      files[0].pipe(res)
      return
    }

    const archive = archiver(archiveFormat)
    archive.on('error', error => {
      log.error(error)
      res.end(format.error(0, error))
    })

    forEach(files, file => {
      archive.append(file, { name: basename(file.path) })
    })
    archive.finalize()

    archive.pipe(res)
  })
}

export async function fetchFiles({ format = 'zip', ...params }) {
  const fileName = params.paths.length > 1 ? `restore_${new Date().toJSON()}.${format}` : basename(params.paths[0])

  return this.registerHttpRequest(
    handleFetchFiles,
    { ...params, format },
    {
      suffix: '/' + encodeURIComponent(fileName),
    }
  ).then(url => ({ $getFrom: url }))
}

fetchFiles.permission = 'admin'
fetchFiles.params = {
  remote: { type: 'string' },
  disk: { type: 'string' },
  format: { type: 'string', optional: true },
  partition: { type: 'string', optional: true },
  paths: {
    type: 'array',
    items: { type: 'string' },
    minLength: 1,
  },
}
