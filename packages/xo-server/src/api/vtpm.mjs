export function create({ vm }) {
  return this.getXapi(vm).VTPM_create({ VM: vm._xapiRef })
}

create.description = 'create a VTPM'

create.params = {
  id: { type: 'string' },
}

create.resolve = {
  vm: ['id', 'VM', 'administrate'],
}

export function destroy({ vtpm }) {
  return this.getXapi(vtpm).call('VTPM.destroy', vtpm._xapiRef)
}

destroy.description = 'destroy a VTPM'

destroy.params = {
  id: { type: 'string' },
}

destroy.resolve = {
  vtpm: ['id', 'VTPM', 'administrate'],
}
