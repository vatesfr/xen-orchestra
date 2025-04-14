import { OpenFlowPlugin } from './openflow-plugin'
import { OpenFlowChannel } from './protocol/openflow-channel'

export async function instantiateController(host, tlsHelper) {
  try {
    const controller = new OpenFlowPlugin(host)
    await controller.check(host)
    return controller
  } catch (error) {
    if (error.code === 'XENAPI_MISSING_PLUGIN' /* || error.code === 'UNKNOWN_XENAPI_PLUGIN_FUNCTION' */) {
      return new OpenFlowChannel(host, tlsHelper)
    } else {
      throw error
    }
  }
}
