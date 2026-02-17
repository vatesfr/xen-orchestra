import type { XoSr } from '@vates/types'
import type { RestApi } from '../rest-api/rest-api.mjs'
import { asyncEach } from '@vates/async-each'
import { Task } from '@vates/task'

const VG_NAME = 'linstor_group'

export class SrService {
  #restApi: RestApi

  constructor(restApi: RestApi) {
    this.#restApi = restApi
  }

  async delete(id: XoSr['id']): Promise<void> {
    const sr = this.#restApi.getObject<XoSr>(id, 'SR')
    const xapiSr = this.#restApi.getXapiObject<XoSr>(id, 'SR')
    const xapi = xapiSr.$xapi

    if (sr.SR_type === 'linstor') {
      const task = this.#restApi.tasks.create({
        name: `deletion of XOSTOR: ${sr.name_label}`,
        objectId: sr.uuid,
        type: 'xo:xostor:destroy',
      })
      await task.run(async () => {
        const hosts = Object.values(xapi.objects.indexes.type.host)

        await Task.run({ properties: { name: 'deletion of the storage', objectId: sr.uuid } }, () =>
          xapi.destroySr(sr.id)
        )
        await Task.run({ properties: { name: 'unbind attached licenses' } }, () =>
          asyncEach(hosts, host =>
            this.#restApi.xoApp.unbindLicense({
              boundObjectId: host.uuid,
              productId: 'xostor',
            })
          )
        )
        await Task.run({ properties: { name: `destroy volume group on ${hosts.length} hosts` } }, () =>
          asyncEach(
            hosts,
            host =>
              xapi.call('host.call_plugin', host.$ref, 'lvm.py', 'destroy_volume_group', {
                vg_name: VG_NAME,
                force: String(true),
              }),
            { stopOnError: false }
          )
        )
      })
    } else {
      await xapi.destroySr(sr.id)
    }
  }
}
