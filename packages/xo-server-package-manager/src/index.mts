import { createLogger } from '@xen-orchestra/log'
import { AptPackageManager } from './apt.mjs'
import type { PackageManagerConfiguration } from './types.mjs'
import type { XoApp } from '@vates/types'

const log = createLogger('xo:xo-server-package-manager')

// --- Configuration schema (empty for now, prepared for future options) ---
export const configurationSchema = {
  type: 'object' as const,
  properties: {},
  additionalProperties: false,
}

type CreateAction = <CbType>(
  cb: (task: unknown) => CbType | Promise<CbType>,
  options: {
    sync?: boolean
    taskProperties: { name: string; [key: string]: unknown }
  }
) => Promise<CbType | undefined>

type RouteCtx = {
  req: {
    params: Readonly<Record<string, string | undefined>>
    body: unknown
  }
  createAction: CreateAction
}

// --- Plugin class ---
class PackageManagerPlugin {
  readonly #xo: XoApp
  readonly #getDataDir: () => Promise<string>
  #configuration: PackageManagerConfiguration | undefined
  #unregisterRestRoutes: (() => void) | undefined

  constructor({ xo, getDataDir }: { xo: XoApp; getDataDir: () => Promise<string> }) {
    this.#xo = xo
    this.#getDataDir = getDataDir
  }

  configure(configuration: PackageManagerConfiguration) {
    this.#configuration = configuration
  }

  async load() {
    const dataDir = await this.#getDataDir()
    const systemPackageManager = new AptPackageManager(dataDir)
    systemPackageManager.checkAvailable()

    this.#unregisterRestRoutes = this.#xo.registerRestRoutes(
      [
        {
          method: 'get',
          endpoint: '/updates',
          description: 'List upgradable system packages from local cache',
          tags: ['xoa'],
          callback: async (_ctx: RouteCtx) => ({
            packages: await systemPackageManager.listUpgradable(),
            isRebootRequired: systemPackageManager.isRebootRequired(),
          }),
        },
        {
          method: 'post',
          endpoint: '/updates/refresh',
          description: 'Run apt-get update and return the updated list of upgradable packages',
          tags: ['xoa'],
          callback: async (_ctx: RouteCtx) => {
            await systemPackageManager.updatePackageList()
            return {
              packages: await systemPackageManager.listUpgradable(),
              isRebootRequired: systemPackageManager.isRebootRequired(),
            }
          },
        },
        {
          method: 'post',
          endpoint: '/updates/upgrade',
          description:
            'Start upgrading all packages (or a subset via JSON body). Returns 202 with taskId; watch /rest/v0/tasks/:taskId for progress.',
          tags: ['xoa'],
          middlewares: [{ name: 'json' }],
          callback: async ({ req, createAction }: RouteCtx) => {
            const body = req.body as Record<string, unknown> | null | undefined
            const packages =
              body !== null && body !== undefined && Array.isArray(body['packages'])
                ? (body['packages'] as string[])
                : undefined
            await createAction(async () => systemPackageManager.runUpgrade(packages), {
              taskProperties: { name: 'upgrade packages' },
            })
          },
        },
        {
          method: 'post',
          endpoint: '/updates/packages/{name}/upgrade',
          description:
            'Start upgrading a specific package. Returns 202 with taskId; watch /rest/v0/tasks/:taskId for progress.',
          tags: ['xoa'],
          params: { name: { type: 'string' } },
          callback: async ({ req, createAction }: RouteCtx) => {
            const name = req.params['name']
            if (name === undefined) {
              throw new Error('Package name is required')
            }
            await createAction(async () => systemPackageManager.runUpgrade([name]), {
              taskProperties: { name: `upgrade ${name}` },
            })
          },
        },
        {
          method: 'post',
          endpoint: '/updates/dist-upgrade',
          description:
            'Start a full distribution upgrade. Returns 202 with taskId; watch /rest/v0/tasks/:taskId for progress.',
          tags: ['xoa'],
          callback: async ({ createAction }: RouteCtx) => {
            await createAction(async () => systemPackageManager.runSystemUpgrade(), {
              taskProperties: { name: 'dist-upgrade' },
            })
          },
        },
      ],
      '/xoa'
    )

    log.info('Plugin loaded')
  }

  async unload() {
    this.#unregisterRestRoutes?.()
    this.#unregisterRestRoutes = undefined
    log.info('Plugin unloaded')
  }
}

// --- Factory (default export) ---
export default function packageManagerPluginFactory(opts: { xo: XoApp; getDataDir: () => Promise<string> }) {
  return new PackageManagerPlugin(opts)
}
