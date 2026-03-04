import RemoteHandlerAbstract from '@xen-orchestra/fs'
import { basename, normalize } from '@xen-orchestra/fs/path'
import { VmFullBackupArchive } from './VmFullBackupArchive.mjs'
import {
  BackupCleanOptions,
  VmBackupInterface,
  PartialBackupMetadata,
  ResolvedBackupCleanOptions,
} from './VmBackup.types.mjs'
import { asyncEach } from '@vates/async-each'
const FILES_TO_KEEP = ['cache.json.gz']

export class VmBackupDirectory implements VmBackupInterface {
  handler: RemoteHandlerAbstract
  rootPath: string
  files: Array<string> = new Array()
  orphans: Set<string> = new Set()
  backupArchives: Map<string, VmBackupInterface> = new Map()
  opts: ResolvedBackupCleanOptions

  constructor(
    handler: RemoteHandlerAbstract,
    vmBackupPath: string,
    opts: BackupCleanOptions = {
      fix: true,
      merge: false,
      remove: false,
      logInfo: console.info,
      logWarn: console.warn,
    }
  ) {
    this.handler = handler
    this.rootPath = vmBackupPath
    this.opts = {
      ...opts,
      fix: opts.fix ?? true,
      merge: opts.merge ?? false,
      remove: opts.remove ?? false,
      logInfo: opts.logInfo ?? console.info,
      logWarn: opts.logWarn ?? console.warn,
    }
  }

  async init() {
    this.files = (await this.handler.list(this.rootPath, { prependDir: true })).map(file => normalize(file))
    for (const fullPath of this.files.filter(path => path.endsWith('.json'))) {
      let metadata = undefined
      try {
        metadata = JSON.parse(await this.handler.readFile(fullPath)) satisfies PartialBackupMetadata
      } catch (error) {
        this.opts.logWarn(`Issue loading ${basename(fullPath)}`)
      }
      if (metadata !== undefined) {
        try {
          const backupArchive = await this.instantiateBackupArchive(fullPath, metadata)
          this.backupArchives.set(fullPath, backupArchive)
        } catch (error) {
          this.opts.logWarn(`Issue loading ${metadata.xva ?? metadata.vhds}`, { json: fullPath, backup: metadata })
        }
      }
    }
  }

  getAssociatedFiles({ prefix = false }) {
    const files = this.files.filter(file => FILES_TO_KEEP.some(pattern => file.endsWith(pattern)))
    return prefix ? files : files.map(file => basename(file))
  }

  async check() {
    for (const backupArchive of this.backupArchives.values()) {
      await backupArchive.check()
    }
    const allUsedFiles = Array.from(this.backupArchives.values()).flatMap(archive =>
      archive.getAssociatedFiles({ prefix: true })
    )
    allUsedFiles.push(...this.getAssociatedFiles({ prefix: true }))
    const orphans = []
    // TODO handle folders and empty folders
    for (const file of this.files.filter(file => !allUsedFiles.includes(file))) {
      orphans.push(file)
    }
    return { orphans, linked: allUsedFiles }
  }

  async clean() {
    const { orphans } = await this.check()
    await asyncEach(orphans, async (orphan: string) => await this.handler.unlink(orphan), { concurrency: 2 })
    for (const orphan of orphans) {
      await this.handler.unlink(orphan)
    }
    return orphans
  }

  async instantiateBackupArchive(metadataPath: string, metadata: PartialBackupMetadata) {
    let backupArchive: VmBackupInterface
    try {
      if (metadata.mode === 'full') {
        backupArchive = new VmFullBackupArchive(
          this.handler,
          this.rootPath,
          metadataPath,
          metadata,
          metadata.xva!,
          this.opts
        )
      } else if (metadata.mode === 'delta') {
        //@ts-ignore
        backupArchive = new VmIncrementalBackupArchive(this.handler)
      } else {
        throw new Error(`Mode ${metadata.mode} not supported`)
      }
    } catch (error) {
      this.opts.logWarn(`Error trying to create backupArchive from ${metadataPath}`, { metadata })
      throw new Error(`Error trying to create backupArchive from ${metadataPath}`)
    }
    await backupArchive.init()
    return backupArchive
  }
}
