import { createLogger } from '@xen-orchestra/log'
import { OpenFlowPlugin } from './openflow-plugin'
import { OpenFlowChannel } from './protocol/openflow-channel'

const log = createLogger('xo:sdn-controller:openflowcontroller')
export async function instantiateController(host, tlsHelper) {
  try {
    const controller = new OpenFlowPlugin(host)
    await controller.check(host)
    log.info('use xapi plugin')
    return controller
  } catch (error) {
    if (error.code === 'XENAPI_MISSING_PLUGIN') {
      log.info('use direct poenflow channel')
      return new OpenFlowChannel(host, tlsHelper)
    } else {
      throw error
    }
  }
}
