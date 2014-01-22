{
  each: $each
} = require 'underscore'

$js2xml = do ->
  {Builder} = require 'xml2js'
  new Builder()

#---------------------------------------------------------------------

{$wait} = require '../fibers-utils'

#=====================================================================

exports.create = ->
  # Validates and retrieves the parameters.
  {
    name
    template
    VIFs
    VDIs
  } = @getParams {
    # Name of the new VM.
    name: { type: 'string' }

    # UUID of the template the VM will be created from.
    template: { type: 'string' }

    # Virtual interfaces to create for the new VM.
    VIFs: {
      type: 'array'
      items: {
        type: 'object'
        properties: {
          network: 'string'
        }
      }
    }

    # Virtual disks to create for the new VM.
    VDIs: {
      optional: true # If not defined, use the template parameters.
      type: 'array'
      items: {
        type: 'object' # TODO: Existing VDI?
        properties: {
          bootable: { type: 'boolean' }
          device: { type: 'string' } # TODO: ?
          size: { type: integer }
          SR: { type: 'string' }
          type: { type: 'string' }
        }
      }
    }
  }

  # Current user must be an administrator.
  @checkPermission 'admin'

  # Gets the template.
  template = $wait @getObject template
  @throw 'NO_SUCH_OBJECT' unless template


  # Gets the corresponding connection.
  xapi = @getXAPI template

  # Clones the VM from the template.
  ref = xapi.call 'VM.clone', template.ref, name

  # Creates associated virtual interfaces.
  $each VIFs, (VIF) ->
    xapi.call 'VIF.create', {
      device: '0'
      MAC: ''
      MTU: '1500'
      network: VIF.network
      other_config: {}
      qos_algorithm_params: {}
      qos_algorithm_type: ''
      VM: ref
    }

  # TODO: ? xapi.call 'VM.set_PV_args', ref, 'noninteractive'

  # Converts the provision disks spec to XML.
  VDIs ?= template.template_info.disks
  VDIs = $js2xml VDIs

  # Replace the existing entry in the VM object.
  try xapi.call 'VM.remove_from_other_config', ref, 'disks'
  xapi.call 'VM.add_to_other_config', ref, 'disks', VDIs

  # Creates the VDIs.
  xapi.call 'VM.provision', ref

  # The VM should be properly created.
  true
