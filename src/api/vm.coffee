{
  each: $each
} = require 'underscore'

$js2xml = do ->
  {Builder} = require 'xml2js'
  builder = new Builder {
    xmldec: {
      # Do not include an XML header.
      #
      # This is not how this setting should be set but due to the
      # implementation of both xml2js and xmlbuilder-js it works.
      #
      # TODO: Find a better alternative.
      headless: true
    }
  }
  builder.buildObject.bind builder

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
          # UUID of the network to create the interface in.
          network: 'string'

          MAC: {
            optional: true # Auto-generated per default.
            type: 'string'
          }
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
          size: { type: 'integer' }
          SR: { type: 'string' }
          type: { type: 'string' }
        }
      }
    }

    # Number of virtual CPUs to start the new VM with.
    CPUs: {
      optional: true # If not defined use the template parameters.
      type: 'integer'
    }
  }

  # Current user must be an administrator.
  @checkPermission 'admin'

  # Gets the template.
  template = @getObject template
  @throw 'NO_SUCH_OBJECT' unless template


  # Gets the corresponding connection.
  xapi = @getXAPI template

  # Clones the VM from the template.
  ref = xapi.call 'VM.clone', template.ref, name

  # Creates associated virtual interfaces.
  $each VIFs, (VIF) ->
    xapi.call 'VIF.create', {
      device: '0'
      MAC: VIF.MAC ? ''
      MTU: '1500'
      network: VIF.network
      other_config: {}
      qos_algorithm_params: {}
      qos_algorithm_type: ''
      VM: ref
    }

  # TODO: ? xapi.call 'VM.set_PV_args', ref, 'noninteractive'

  # Updates the number of existing vCPUs.
  if CPUs?
    xapi.call 'VM.set_VCPUs_at_startup', ref, CPUs

  if VDIs?
    # Transform the VDIs specs to conform to XAPI.
    $each VDIs, (VDI, key) ->
      VDI.bootable = if VDI.bootable then 'true' else 'false'
      VDI.size = "#{VDI.size}"
      VDI.sr = VDI.SR
      delete VDI.SR

      # Preparation for the XML generation.
      VDIs[key] = { $: VDI }

    # Converts the provision disks spec to XML.
    VDIs = $js2xml {
      provision: {
        disk: VDIs
      }
    }

    # Replace the existing entry in the VM object.
    try xapi.call 'VM.remove_from_other_config', ref, 'disks'
    xapi.call 'VM.add_to_other_config', ref, 'disks', VDIs

    # Creates the VDIs.
    xapi.call 'VM.provision', ref

  # The VM should be properly created.
  true

exports.set = ->
  params = @getParams {
    # Identifier of the VM to update.
    id: { type: 'string' }

    name_label: { type: 'string', optional: true }

    name_description: { type: 'string', optional: true }

    # Number of virtual CPUs to allocate.
    CPUs: { 'type': integer, optional: true }

    # Memory to allocate (in bytes).
    memory: { 'type': integer, optional: true }
  }

  try
    VM = @getObject params.id
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI VM

  # Some settings can only be changed when the VM is halted.
  if 'CPUs' of params and VM.power_state isnt 'Halted'
    @throw 'INVALID_PARAMS'

  for param, field of {
    CPUs: 'VCPUs_at_startup'
    memory: 'memory_dynamic_max'
    'name_label'
    'name_description'
  }
    if field of params?
      xapi.call "VM.set_#{field}", VM.ref, params[param]
