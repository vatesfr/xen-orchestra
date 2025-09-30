import { createLogger } from '@xen-orchestra/log'
import { OpenFlowPlugin } from './openflow-plugin'
import { OpenFlowChannel } from './protocol/openflow-channel'

const log = createLogger('xo:sdn-controller:openflowcontroller')
export async function instantiateController(host, tlsHelper, config) {
  if (config.useDirectChannel) {
    log.info('use direct openflow channel')
    return new OpenFlowChannel(host, tlsHelper)
  } else {
    const controller = new OpenFlowPlugin(host)
    await controller.check(host)
    log.info('use xapi plugin')
    return controller
  }
}
