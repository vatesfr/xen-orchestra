# FIXME: too low level, should be removed.

{$coroutine, $wait} = require '../fibers-utils'

#=====================================================================

delete_ = $coroutine ({vbd}) ->
  xapi = @getXAPI vbd

  # TODO: check if VBD is attached before
  $wait xapi.call 'VBD.destroy', vbd.ref

  return true

delete_.params = {
  id: { type: 'string' }
}

delete_.resolve = {
  vbd: ['id', 'VBD'],
}

exports.delete = delete_

#---------------------------------------------------------------------

disconnect = $coroutine ({vbd}) ->
  xapi = @getXAPI vbd

  # TODO: check if VBD is attached before
  $wait xapi.call 'VBD.unplug_force', vbd.ref

  return true

disconnect.params = {
  id: { type: 'string' }
}

disconnect.resolve = {
  vbd: ['id', 'VBD'],
}

exports.disconnect = disconnect

#---------------------------------------------------------------------

connect = $coroutine ({vbd}) ->
  xapi = @getXAPI vbd

  # TODO: check if VBD is attached before
  $wait xapi.call 'VBD.plug', vbd.ref

  return true

connect.params = {
  id: { type: 'string' }
}

connect.resolve = {
  vbd: ['id', 'VBD'],
}

exports.connect = connect

#---------------------------------------------------------------------

create = $coroutine ({vm, vdi, mode, position}) ->
  xapi = @getXAPI vm

  vbdRef = $wait xapi.call(
    'VBD.create',
    {
      VM: vm.ref,
      VDI:vdi.ref,
      mode: mode,
      bootable: false,
      userdevice: position,
      type: "Disk",
      empty: false,
      other_config: {},
      qos_algorithm_type: "",
      qos_algorithm_params: {}
    }
  )

  vbd = $wait xapi.call('VBD.get_record', vbdRef)
  return vbd.uuid

create.params = {
  vm: { type: 'string' },
  vdi: { type: 'string' },
  mode: { type: 'string' },
  position: { type: 'string' }
}

create.resolve = {
  vm: ['vm', 'VM'],
  vdi: ['vdi', 'VDI'],
}

create.description = 'Create a new VBD and return its UUID'
exports.create = create
