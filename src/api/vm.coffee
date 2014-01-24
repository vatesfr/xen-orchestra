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
          size: { type: 'integer' }
          SR: { type: 'string' }
          type: { type: 'string' }
        }
      }
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
      MAC: ''
      MTU: '1500'
      network: VIF.network
      other_config: {}
      qos_algorithm_params: {}
      qos_algorithm_type: ''
      VM: ref
    }

  # TODO: ? xapi.call 'VM.set_PV_args', ref, 'noninteractive'

  # Transform the VDIs specs to conform to XAPI.
  VDIs ?= VDIs ? template.template_info.disks
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
