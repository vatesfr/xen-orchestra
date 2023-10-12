export async function create({ vm }) {
  const xapi = this.getXapi(vm)
  const vtpmRef = await xapi.VTPM_create({ VM: vm._xapiRef })
  return xapi.getField('VTPM', vtpmRef, 'uuid')
}

create.description = 'create a VTPM'

create.params = {
  id: { type: 'string' },
}

create.resolve = {
  vm: ['id', 'VM', 'administrate'],
}

export async function destroy({ vtpm }) {
  await this.getXapi(vtpm).call('VTPM.destroy', vtpm._xapiRef)
}

destroy.description = 'destroy a VTPM'

destroy.params = {
  id: { type: 'string' },
}

destroy.resolve = {
  vtpm: ['id', 'VTPM', 'administrate'],
}
