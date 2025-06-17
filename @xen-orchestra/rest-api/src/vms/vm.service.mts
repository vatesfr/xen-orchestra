import { createLogger } from '@xen-orchestra/log'
import { type Defer, defer } from 'golike-defer'
import { Task } from '@vates/task'
import type { XenApiVdiWrapped, XoPool, XoVdi, XoVm, XoVmTemplate } from '@vates/types'

import type { CreateVmAfterCreateParams, CreateVmParams } from '../pools/pool.type.mjs'
import type { RestApi } from '../rest-api/rest-api.mjs'

const log = createLogger('xo:rest-api:vm-service')

export class VmService {
  #restApi: RestApi
  constructor(restApi: RestApi) {
    this.#restApi = restApi
  }

  async #create(
    $defer: Defer,
    params: CreateVmParams &
      CreateVmAfterCreateParams & {
        pool: XoPool['id']
        template: XoVmTemplate['uuid']
      }
  ): Promise<XoVm['id']> {
    const { pool, template, cloud_config, boot, destroy_cloud_config_vdi, network_config, ...rest } = params
    const xoApp = this.#restApi.xoApp
    const xapi = this.#restApi.xoApp.getXapi(pool)
    const currentUser = this.#restApi.getCurrentUser()

    const xapiVm = await xapi.createVm(template, rest, undefined, currentUser?.id)
    $defer.onFailure(() => xapi.VM_destroy(xapiVm.$ref))
    const xoVm = this.#restApi.getObject<XoVm>(xapiVm.uuid as XoVm['id'], 'VM')

    let cloudConfigVdi: XenApiVdiWrapped | undefined
    if (cloud_config !== undefined) {
      const cloudConfigVdiUuid = await xapi.VM_createCloudInitConfig(xapiVm.$ref, cloud_config, {
        networkConfig: network_config,
      })
      cloudConfigVdi = xoApp.getXapiObject<XoVdi>(cloudConfigVdiUuid as XoVdi['id'], 'VDI')
    }

    let timeLimit: number | undefined
    if (boot) {
      timeLimit = Date.now() + 10 * 60 * 1000
      await xapiVm.$callAsync('start', false, false)
    }

    if (destroy_cloud_config_vdi && cloudConfigVdi !== undefined && boot) {
      Task.info('Destruction of the cloud config VDI is planned and will be done as soon as possible')
      xapi.VDI_destroyCloudInitConfig(cloudConfigVdi.$ref, { timeLimit }).catch(error => {
        log.error('destroy cloud init config VDI failed', {
          error,
          vdi: {
            uuid: cloudConfigVdi.uuid,
          },
          vm: {
            uuid: xoVm.uuid,
          },
        })
      })
    }
    return xoVm.id
  }
  create = defer(this.#create)
}
