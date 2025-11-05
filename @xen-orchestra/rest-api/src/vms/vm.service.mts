import { createLogger } from '@xen-orchestra/log'
import { type Defer, defer } from 'golike-defer'
import { Task } from '@vates/task'
import {
  AnyXoVm,
  VM_POWER_STATE,
  XoVbd,
  XoVdiSnapshot,
  XoVmController,
  XoVmSnapshot,
  type XenApiVdiWrapped,
  type XoPool,
  type XoVdi,
  type XoVm,
  type XoVmTemplate,
} from '@vates/types'
import { Response as ExResponse } from 'express'
import { Readable } from 'node:stream'

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
    const xapi = xoApp.getXapi(pool)
    const currentUser = this.#restApi.getCurrentUser()

    const xapiVm = await xapi.createVm(template, rest, undefined, currentUser.id)
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

  getVmsStatus(opts?: { filter?: string | ((obj: XoVm) => boolean) }) {
    const vms = this.#restApi.getObjectsByType<XoVm>('VM', opts)

    let nRunning = 0
    let nPaused = 0
    let nSuspended = 0
    let nHalted = 0
    let nUnknown = 0
    let total = 0

    for (const id in vms) {
      total++
      const vm = vms[id as XoVm['id']]

      switch (vm.power_state) {
        case VM_POWER_STATE.RUNNING:
          nRunning++
          break
        case VM_POWER_STATE.HALTED:
          nHalted++
          break
        case VM_POWER_STATE.PAUSED:
          nPaused++
          break
        case VM_POWER_STATE.SUSPENDED:
          nSuspended++
          break
        default:
          log.warn('Invalid VM power_state', vm.id, vm.power_state)
          nUnknown++
          break
      }
    }

    return {
      running: nRunning,
      halted: nHalted,
      paused: nPaused,
      suspended: nSuspended,
      unknown: nUnknown,
      total,
    }
  }

  getVmVdis(id: XoVm['id'], vmType: 'VM'): XoVdi[]
  getVmVdis(id: XoVmTemplate['id'], vmType: 'VM-template'): XoVdi[]
  getVmVdis(id: XoVmSnapshot['id'], vmType: 'VM-snapshot'): XoVdiSnapshot[]
  getVmVdis(id: XoVmController['id'], vmType: 'VM-controller'): (XoVdi | XoVdiSnapshot)[]
  getVmVdis<T extends AnyXoVm>(id: T['id'], vmType: T['type']): (XoVdi | XoVdiSnapshot)[] {
    const getObject = this.#restApi.getObject.bind(this.#restApi)
    const vdis: (XoVdi | XoVdiSnapshot)[] = []

    const vm = getObject<T>(id, vmType)

    for (const vbdId of vm.$VBDs) {
      const vbd = getObject<XoVbd>(vbdId, 'VBD')
      if (vbd.VDI !== undefined) {
        const vdi = getObject<XoVdi | XoVdiSnapshot>(vbd.VDI, ['VDI-snapshot', 'VDI'])
        vdis.push(vdi)
      }
    }

    return vdis
  }

  async export<Vm extends XoVm | XoVmSnapshot | XoVmTemplate>(
    id: Vm['id'],
    vmType: Vm['type'],
    { compress, format, response }: { compress?: boolean; format: 'ova' | 'xva'; response?: ExResponse }
  ): Promise<Readable> {
    const xapiVm = this.#restApi.getXapiObject(id, vmType)

    let stream: Readable
    if (format === 'xva') {
      stream = (await xapiVm.$xapi.VM_export(xapiVm.$ref, { compress })).body
    } else {
      stream = await xapiVm.$xapi.exportVmOva(xapiVm.$ref)
    }

    if (response !== undefined) {
      const headers = new Headers({
        'content-disposition': `attachment; filename=${id}.${format}`,
        'content-type': 'application/octet-stream',
      })

      response.setHeaders(headers)
    }

    return stream
  }
}
