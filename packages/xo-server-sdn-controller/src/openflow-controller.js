import { OpenFlowPlugin } from './openflow-plugin'
import { OpenFlowChannel } from './protocol/openflow-channel'

export async function instantiateController(host, tlsHelper) {
  try {
    const controller = new OpenFlowPlugin(host)
    await controller.check(host)
    console.log('USE OPENFLOW')
    return controller
  } catch (error) {
    if (error.code === 'XENAPI_MISSING_PLUGIN') {
      console.log('FALL BACK TO DIRECT',{error})
      return new OpenFlowChannel(host, tlsHelper)
    } else {
      throw error
    }
  }
}
