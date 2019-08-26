export async function downloadAndInstallResource({
  namespace,
  id,
  version,
  sr,
}) {
  if (!this.requestResource) {
    throw new Error('requestResource is not a function')
  }
  const xapi = this.getXapi(sr.$poolId)
  const stream = await this.requestFreeResource(namespace, id, version)
  const vm = await xapi.importVm(stream, {
    data: undefined,
    srId: sr.id,
    type: 'xva',
  })
  return vm.uuid
}

downloadAndInstallResource.description =
  'Download and install a resource via cloud plugin'

downloadAndInstallResource.params = {
  id: { type: 'string' },
  namespace: { type: 'string' },
  version: { type: 'string' },
  sr: { type: 'string' },
}

downloadAndInstallResource.resolve = {
  sr: ['sr', 'SR', 'administrate'],
}

downloadAndInstallResource.permission = 'admin'
