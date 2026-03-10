import { execFile } from 'node:child_process'
import { mkdtemp, readdir, rename, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import type { XoHost, XoPif, XoPool } from '@vates/types/xo'
import { Xapi } from '@vates/types'
import { LiveBackupRepository } from './LiveBackupRepository.mjs'
import type { RawConsumer } from './LiveBackupRepository.mjs'

export type { XoHost, XoPif, XoPool }

const execFileAsync = promisify(execFile)

/**
 * xapi.objects is not in the Xapi interface but exists at runtime on the xapi client.
 */
type XapiWithObjects = Xapi & {
  objects: {
    indexes: {
      type: Record<string, Record<string, Record<string, unknown>>>
    }
  }
  getRecord(type: string, ref: string): Promise<Record<string, unknown>>
}

/**
 * Exposes a set of backup disks as a file-based SR accessible by all
 * enabled hosts of a XCP-ng pool over NFS.
 *
 * Assumes: running as root, nfs-kernel-server is active on the local machine.
 *
 * Lifecycle:
 *   1. Construct with the xapi client and the local server IP visible to pool hosts.
 *   2. Call addDisk() for each disk to expose.
 *   3. Call init() — exports NFS, registers SR via XAPI, then mounts FUSE.
 *   4. Call close() to tear everything down in reverse order.
 */
export class VirtualStorageRepository {
  readonly #xapi: XapiWithObjects
  readonly #serverIp: string
  readonly #ips: string[]

  #mountDir: string | undefined
  #cacheDir: string | undefined
  #srRef: string | undefined
  #liveRepo: LiveBackupRepository | undefined
  #exportedSpecs: string[] = []

  // disks registered before init()
  readonly #pendingDisks: RawConsumer[] = []

  /**
   * @param xapi      Connected XAPI client for the pool.
   * @param serverIp  IP address of this machine as reachable from pool hosts (used as NFS server).
   */
  constructor(xapi: Xapi, serverIp: string) {
    this.#xapi = xapi as XapiWithObjects
    this.#serverIp = serverIp
    this.#ips = Object.values(this.#xapi.objects.indexes.type['PIF'] ?? {})
      .map(pif => pif['IP'] as string)
      .filter(ip => ip !== '' && ip !== undefined)
  }

  /**
   * Register a disk to be exposed as a read-only VHD file in the SR.
   * May be called before or after init().
   */
  addDisk(disk: RawConsumer): void {
    if (this.#liveRepo !== undefined) {
      this.#liveRepo.addDisk(disk)
    } else {
      this.#pendingDisks.push(disk)
    }
  }

  async init(): Promise<void> {
    const base = tmpdir()
    this.#mountDir = await mkdtemp(join(base, 'xo-vsr-mount-'))
    this.#cacheDir = await mkdtemp(join(base, 'xo-vsr-cache-'))

    await this.#exportNfs(this.#mountDir)
    const srUuid = await this.#createSr(this.#mountDir)
    await this.#mountFuse(join(this.#mountDir, srUuid), this.#cacheDir)
  }

  // Export mountDir to each host IP via NFS.
  // -i: bypass /etc/exports, manage the export in kernel memory only.
  async #exportNfs(mountDir: string): Promise<void> {
    const exportOpts = 'rw,no_root_squash,sync'
    for (const ip of this.#ips) {
      const spec = `${ip}:${mountDir}`
      await execFileAsync('exportfs', ['-i', '-o', exportOpts, spec])
      this.#exportedSpecs.push(spec)
    }
  }

  // Register a new NFS SR on the pool master via XAPI (mirrors createNfs in xo-server).
  // Returns the SR UUID assigned by XCP-ng.
  async #createSr(serverPath: string): Promise<string> {
    const pool = Object.values(this.#xapi.objects.indexes.type['pool'])[0]
    const masterHost = await this.#xapi.getRecord('host', pool['master'] as string)

    this.#srRef = await this.#xapi.call<string>(
      'SR.create',
      masterHost['$ref'],
      { server: this.#serverIp, serverpath: serverPath },
      0,
      'Backup Repository',
      '',
      'nfs',
      '',
      true,
      {}
    )

    const sr = await this.#xapi.call<{ uuid: string }>('SR.get_record', this.#srRef)
    return sr.uuid
  }

  // Move XCP-ng bootstrap files out of srDir into cacheDir (FUSE requires an empty mountpoint),
  // then mount the FUSE filesystem at srDir backed by cacheDir.
  async #mountFuse(srDir: string, cacheDir: string): Promise<void> {
    for (const entry of await readdir(srDir)) {
      await rename(join(srDir, entry), join(cacheDir, entry))
    }

    this.#liveRepo = new LiveBackupRepository(srDir, cacheDir)
    for (const disk of this.#pendingDisks) {
      this.#liveRepo.addDisk(disk)
    }
    this.#pendingDisks.length = 0
    await this.#liveRepo.init()
  }

  async close(): Promise<void> {
    // Tear down in strict reverse order: SR → NFS → FUSE → temp dirs

    if (this.#srRef !== undefined) {
      await this.#xapi.call('SR.forget', this.#srRef).catch(() => {})
      this.#srRef = undefined
    }

    for (const spec of this.#exportedSpecs) {
      await execFileAsync('exportfs', ['-u', spec]).catch(() => {})
    }
    this.#exportedSpecs = []

    await this.#liveRepo?.close()
    this.#liveRepo = undefined

    if (this.#mountDir !== undefined) {
      await rm(this.#mountDir, { recursive: true, force: true })
      this.#mountDir = undefined
    }
    if (this.#cacheDir !== undefined) {
      await rm(this.#cacheDir, { recursive: true, force: true })
      this.#cacheDir = undefined
    }
  }
}
