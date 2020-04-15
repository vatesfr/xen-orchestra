import assert from 'assert'
import echo from './message/echo'
import error from './message/error'
import hello from './message/hello'
import featuresRequest from './message/features-request'
import featuresReply from './message/features-reply'
import getConfigRequest from './message/get-config-request'
import switchConfig from './message/switch-config'
import flowMod from './message/flow-mod'
import of from './openflow-11'

// =============================================================================

const MESSAGE = {
  [of.type.hello]: hello,
  [of.type.error]: error,
  [of.type.featuresRequest]: featuresRequest,
  [of.type.featuresReply]: featuresReply,
  [of.type.echoRequest]: echo,
  [of.type.echoReply]: echo,
  [of.type.getConfigRequest]: getConfigRequest,
  [of.type.getConfigReply]: switchConfig,
  [of.type.setConfig]: switchConfig,
  [of.type.flowMod]: flowMod,
}

// =============================================================================

export default {
  protocol: of,

  // ---------------------------------------------------------------------------

  fromJson: object => {
    const type = object.header.type
    assert(Object.keys(MESSAGE).includes(String(type)))

    return MESSAGE[type].fromJson(object)
  },

  toJson: (buffer, offset = 0) => {
    const type = buffer.readUInt8(offset + of.offsets.header.type)
    assert(Object.keys(MESSAGE).includes(String(type)))

    return MESSAGE[type].toJson(buffer, offset)
  },
}
