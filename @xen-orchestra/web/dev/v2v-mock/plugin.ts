import type { XoV2vInventoryPayload, XoV2vStartPayload, XoV2vStatus, XoV2vVm } from '@vates/types'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { createMockInventory } from './fixtures.ts'

type V2vMockOptions = {
  enabled: boolean
  vecturaError?: string
}

function sendJson(response: ServerResponse, status: number, body: unknown) {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json')
  response.end(JSON.stringify(body))
}

async function readJson<T>(request: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = []

  for await (const chunk of request) {
    chunks.push(chunk as Buffer)
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as T
}

async function handleInventory(request: IncomingMessage, response: ServerResponse) {
  const { connection } = await readJson<XoV2vInventoryPayload>(request)

  if (connection.password === 'bad') {
    sendJson(response, 422, { error: 'invalid credentials', data: { code: 'V2V_INVALID_CREDENTIALS' } })

    return
  }

  if (connection.host === 'unreachable.lab') {
    sendJson(response, 500, { error: `${connection.host}:${connection.port} is unreachable` })

    return
  }

  // A real inventory takes a while: let the "connecting" state show
  await new Promise(resolve => setTimeout(resolve, 800))

  sendJson(response, 200, createMockInventory(connection.host))
}

type V2vStartProblem = { vm?: XoV2vVm['id']; field?: string; message: string }

const CLEANUP_UNSUPPORTED = 'cleaning up the VM is not supported yet'

// Mirrors `planMigration` of the REST API (`@xen-orchestra/rest-api/src/v2v/v2v.plan.mts`): every problem at once
function planMockMigration({ connection, defaults, vms }: XoV2vStartPayload): V2vStartProblem[] {
  const problems: V2vStartProblem[] = []
  const sourceVms = new Map(createMockInventory(connection.host).vms.map(vm => [vm.id, vm]))
  const seenVmIds = new Set<XoV2vVm['id']>()

  if (defaults.cleanup) {
    problems.push({ field: 'defaults.cleanup', message: CLEANUP_UNSUPPORTED })
  }

  for (const vm of vms) {
    const report = (message: string, field?: string) => problems.push({ vm: vm.id, field, message })

    if (seenVmIds.has(vm.id)) {
      report('the VM is listed more than once')

      continue
    }

    seenVmIds.add(vm.id)

    const sourceVm = sourceVms.get(vm.id)

    if (sourceVm === undefined) {
      report('no such VM on the source')

      continue
    }

    if (vm.cleanup) {
      report(CLEANUP_UNSUPPORTED, 'cleanup')
    }

    if (vm.tags.length > 0) {
      report('setting tags is not supported yet', 'tags')
    }

    if (!vm.keepMac) {
      report('the MAC addresses are always kept for now', 'keepMac')
    }

    // the guest is only repaired, and the VM only started, once its import is complete
    const isPartial = !(vm.stopSource ?? defaults.stopSource) && sourceVm.powerState !== 'poweredOff'

    if (isPartial && (vm.repair ?? defaults.repair) !== false) {
      report('the guest can only be repaired by a complete import: stop the source, or use stopSource', 'repair')
    }

    if (isPartial && (vm.startVm ?? defaults.startVm)) {
      report('the VM can only be started after a complete import: stop the source, or use stopSource', 'startVm')
    }

    for (const disk of sourceVm.disks) {
      if (disk.isRdm) {
        report(`the disk ${disk.key} is a raw device mapping, which cannot be imported`, 'disks')
      }

      if (disk.isEncrypted) {
        report(`the disk ${disk.key} is encrypted, which cannot be imported`, 'disks')
      }
    }
  }

  return problems
}

async function handleStart(request: IncomingMessage, response: ServerResponse) {
  const problems = planMockMigration(await readJson<XoV2vStartPayload>(request))

  if (problems.length > 0) {
    // What the REST API error handler answers for `invalidParameters`
    sendJson(response, 422, { error: 'the migration cannot be started', data: { errors: problems } })

    return
  }

  // The task does not exist in XO: its link leads to an empty task panel
  sendJson(response, 202, { taskId: `v2v-mock-task-${Date.now()}` })
}

const START_PATHNAME = /^\/rest\/v0\/pools\/[^/]+\/actions\/import_vms_from_vmware$/

// Stands in for the V2V REST routes until the back end ships them (dev server only, never built)
export function v2vMockPlugin({ enabled, vecturaError }: V2vMockOptions): Plugin {
  return {
    name: 'xo-v2v-mock',
    apply: (_config, { command }) => enabled && command === 'serve',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const { pathname } = new URL(request.url ?? '/', 'http://localhost')

        if (pathname === '/rest/v0/v2v/status' && request.method === 'GET') {
          const status: XoV2vStatus = {
            vectura: vecturaError ? { status: 'error', error: vecturaError } : { status: 'success' },
          }

          sendJson(response, 200, status)

          return
        }

        if (pathname === '/rest/v0/v2v/inventory' && request.method === 'POST') {
          handleInventory(request, response).catch(next)

          return
        }

        if (START_PATHNAME.test(pathname) && request.method === 'POST') {
          handleStart(request, response).catch(next)

          return
        }

        next()
      })
    },
  }
}
