import { asyncEach } from '@vates/async-each'
import { Task } from '@vates/task'
import { invalidParameters } from 'xo-common/api-errors.js'
import type { VatesTask } from '@vates/types/lib/vates/task'
import type { EsxiConnectionParams, XoPool } from '@vates/types'

import { ApiError } from '../helpers/error.helper.mjs'
import type { RestApi } from '../rest-api/rest-api.mjs'
import { planMigration, type V2vVmPlan } from './v2v.plan.mjs'
import type { V2vConnection, V2vInventory, V2vStartBody, V2vStartResult } from './v2v.type.mjs'

/** the name of the root task */
export const V2V_TASK_NAME = 'V2V migration'

const DEFAULT_CONCURRENCY = 2

export class V2vService {
  #restApi: RestApi

  constructor(restApi: RestApi) {
    this.#restApi = restApi
  }

  /**
   * The SOAP client and the HTTP downloads of the disks both take the port as part of the host
   */
  static toConnectionParams({ host, port, username, password, skipSslCheck = false }: V2vConnection) {
    let address = host.trim()
    // an IPv6 address has to be bracketed to be followed by a port
    const isIpv6 = address.split(':').length > 2 && !address.startsWith('[')
    if (isIpv6) {
      address = `[${address}]`
    }
    if (port !== undefined && port !== 443) {
      address = `${address}:${port}`
    }
    return { host: address, user: username, password, sslVerify: !skipSslCheck } satisfies EsxiConnectionParams
  }

  async getInventory(connection: V2vConnection): Promise<V2vInventory> {
    try {
      const inventory = await this.#restApi.xoApp.getEsxiInventory(V2vService.toConnectionParams(connection))
      return { platform: 'vmware', ...inventory }
    } catch (error) {
      throw toSourceError(error, connection.host)
    }
  }

  /**
   * Everything is checked before the task is created: a refused launch imports nothing
   */
  async prepareStart(body: V2vStartBody): Promise<V2vVmPlan[]> {
    // the pool has to exist
    this.#restApi.getObject<XoPool>(body.pool as XoPool['id'], 'pool')

    const { vms } = await this.getInventory(body.connection)

    const { plans, problems } = planMigration(body, new Map(vms.map(vm => [vm.id, vm])))

    if (problems.length > 0) {
      throw invalidParameters('the migration cannot be started', problems)
    }
    return plans
  }

  async start(
    task: VatesTask,
    { connection, concurrency = DEFAULT_CONCURRENCY, stopOnError = false }: Readonly<V2vStartBody>,
    plans: readonly V2vVmPlan[]
  ): Promise<V2vStartResult> {
    const connectionParams = V2vService.toConnectionParams(connection)
    const result: V2vStartResult = {}
    let done = 0
    task.set('total', plans.length)
    task.set('done', 0)
    task.set('progress', 0)

    try {
      await asyncEach(
        plans,
        async ({ id, name, sr, network, disks, nics, template, stopSource, repair, startVm }) => {
          await Task.run({ properties: { name: `importing VM ${name}`, sourceVmId: id } }, async () => {
            try {
              result[id] = await this.#restApi.xoApp.migrationfromEsxi({
                ...connectionParams,
                vm: id,
                sr,
                network,
                disks,
                nics,
                template,
                stopSource,
                repair,
                startVm,
              })
            } finally {
              done++
              task.set('done', done)
              task.set('progress', Math.round((done * 100) / plans.length))
            }
          })
        },
        { concurrency, stopOnError }
      )
      return result
    } catch (error) {
      // same contract as `vm.importMultipleFromEsxi`: the VMs imported before the failure are not lost
      if (error instanceof Error) {
        Object.assign(error, { succeeded: result })
      }
      throw error
    }
  }
}

/**
 * A failure of the source is not a failure of XO: an invalid login is the answer the first step of the
 * wizard waits for
 */
function toSourceError(error: unknown, host: string): unknown {
  if (!(error instanceof Error)) {
    return error
  }
  const code = 'code' in error ? error.code : undefined
  if (code === 'InvalidLogin') {
    const apiError = new ApiError('invalid credentials for the source', 400, { data: { code, host } })
    apiError.cause = error
    return apiError
  }
  return error
}
