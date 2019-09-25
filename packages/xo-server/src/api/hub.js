export async function downloadAndInstallResource({
  id,
  namespace,
  sr,
  version,
}) {
  if (this.requestResource === undefined) {
    throw new Error(
      'xo-server-cloud plugin may not be loaded or requestResource is not a function'
    )
  }
  const stream = await this.requestResource(namespace, id, version, true)
  const vm = await this.getXapi(sr.$poolId).importVm(stream, {
    srId: sr.id,
    type: 'xva',
  })
  await vm.update_other_config('xva_id', id)
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
