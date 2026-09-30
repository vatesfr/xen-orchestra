/**
 * A datastore path is expressed in multiple ways depending on its source:
 * - `ds:///vmfs/volumes/<uuid>/` in the `summary.url` reported by vCenter
 * - `/vmfs/volumes/<uuid>` in the `summary.url` reported by an ESXi host
 * - `/vmfs/volumes/<uuid>/<dir>/<file>.vmdk` in the vmx of a VM ( typical of vSAN )
 *
 * They are normalized before being compared.
 *
 * @param {string} path
 * @returns {string}
 */
export function normalizeDatastorePath(path) {
  return path.replace(/^ds:\/\//, '').replace(/\/+$/, '')
}

/**
 * Resolves the datastore and the path of a disk referenced by a vmx or a vmsd.
 *
 * The reference is either relative to the directory of the VM, or absolute in the file system of
 * the host, in which case the datastore containing it has to be found.
 *
 * @param {object} params
 * @param {Record<string, { name: string }>} params.dataStores - datastore summaries, indexed by url
 * @param {string} params.currentDataStore - name of the datastore holding the vmx
 * @param {string} params.currentPath - directory of the vmx, in its datastore
 * @param {string} params.filePath - reference to resolve
 * @returns {{ dataStore: string, path: string }}
 */
export function resolveDiskLocation({ dataStores, currentDataStore, currentPath, filePath }) {
  if (!/^(ds:\/\/)?\//.test(filePath)) {
    return { dataStore: currentDataStore, path: `${currentPath}/${filePath}` }
  }

  const normalizedFilePath = normalizeDatastorePath(filePath)
  for (const [dataStoreUrl, dataStore] of Object.entries(dataStores)) {
    const prefix = normalizeDatastorePath(dataStoreUrl)
    if (prefix === '') {
      // a datastore whose `summary.url` is empty or is only `ds:///` would match every absolute
      // path, and the first one wins: the disk would be looked for on the wrong datastore
      continue
    }
    if (normalizedFilePath.startsWith(prefix + '/')) {
      return { dataStore: dataStore.name, path: normalizedFilePath.substring(prefix.length + 1) }
    }
  }

  // the disk used to be looked for on a datastore named `undefined`, and the failure surfaced much
  // later as an assertion error
  const error = new Error(`can't find the datastore containing the disk ${filePath}`)
  error.code = 'DATASTORE_NOT_FOUND'
  error.dataStoreUrls = Object.keys(dataStores)
  error.filePath = filePath
  throw error
}
