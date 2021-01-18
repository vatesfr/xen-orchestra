Unpacking a received OpenFlow message from a socket:

```js
import openflow from '@xen-orchestra/openflow'
import parse from '@xen-orchestra/openflow/parse-socket'

const version = openflow.versions.openFlow11
const ofProtocol = openflow.protocols[version]

function parseOpenFlowMessages(socket) {
  for await (const msg of parse(socket)) {
    if (msg.header !== undefined) {
      const ofType = msg.header.type
      switch (ofType) {
        case ofProtocol.type.hello:
          // Handle OFPT_HELLO
          break
        case ofProtocol.type.error:
          // Handle OFPT_ERROR
          break
        case ofProtocol.type.echoRequest:
          // Handle OFPT_ECHO_REQUEST
          break
        case ofProtocol.type.packetIn:
          // Handle OFPT_PACKET_IN
          break
        case ofProtocol.type.featuresReply:
          // Handle OFPT_FEATURES_REPLY
          break
        case ofProtocol.type.getConfigReply:
          // Handle OFPT_GET_CONFIG_REPLY
          break
        case ofProtocol.type.portStatus:
          // Handle OFPT_PORT_STATUS
          break
        case ofProtocol.type.flowRemoved:
          // Handle OFPT_FLOW_REMOVED
          break
        default:
          // Error: Invalid type
          break
      }
    } else {
      // Error: Message is unparseable
    }
  }
}
```

Unpacking a OpenFlow message from a buffer:

```js
import openflow from '@xen-orchestra/openflow'

const version = openflow.versions.openFlow11
const ofProtocol = openflow.protocols[version]

function processOpenFlowMessage(buf) {
  const unpacked = openflow.unpack(buf)
  const ofType = unpacked.header.type
  switch (ofType) {
    case ofProtocol.type.hello:
      // Handle OFPT_HELLO
      break
    case ofProtocol.type.error:
      // Handle OFPT_ERROR
      break
    case ofProtocol.type.echoRequest:
      // Handle OFPT_ECHO_REQUEST
      break
    case ofProtocol.type.packetIn:
      // Handle OFPT_PACKET_IN
      break
    case ofProtocol.type.featuresReply:
      // Handle OFPT_FEATURES_REPLY
      break
    case ofProtocol.type.getConfigReply:
      // Handle OFPT_GET_CONFIG_REPLY
      break
    case ofProtocol.type.portStatus:
      // Handle OFPT_PORT_STATUS
      break
    case ofProtocol.type.flowRemoved:
      // Handle OFPT_FLOW_REMOVED
      break
    default:
      // Error: Invalid type
      break
  }
}
```

Packing an OpenFlow OFPT_HELLO message:

```js
import openflow from '@xen-orchestra/openflow'

const version = openflow.versions.openFlow11
const ofProtocol = openflow.protocols[version]

const buf = openflow.pack({
  header: {
    version,
    type: ofProtocol.type.hello,
    xid: 1,
  },
})
```
