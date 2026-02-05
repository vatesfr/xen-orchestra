import { RemoteHandlerAbstract } from '@xen-orchestra/fs'
import { resolve } from 'node:path'
import { IBackupLineage, PartialBackupMetadata } from './DiskLineage.types.mts'
import { VmFullBackupArchive } from './VmFullBackupArchive.mts'
import { VmBackupArchive, VmIncrementalBackupArchive } from './VmBackupArchive.mts'

const FILES_TO_KEEP = ['cache.json.gz']

class VmBackupDirectory {
  #handler: typeof RemoteHandlerAbstract
  rootPath: string
  files: Array<string>
  orphans: Set<string>
  backupArchives: Map<string, VmBackupArchive>

  constructor(handler: typeof RemoteHandlerAbstract, vmBackupPath: string) {
    this.#handler = handler
    this.rootPath = vmBackupPath
    this.files = []
    this.orphans = new Set()
    this.backupArchives = new Map()
  }

  async init() {
    this.files = await this.#handler.list(this.rootPath, { prependDir: true })
    for (const fullPath of this.files.filter(path => path.endsWith('.json'))) {
      const metadata = JSON.parse(await this.#handler.readFile(fullPath)) satisfies PartialBackupMetadata
      try {
        const backupArchive = await this.createBackupArchive(fullPath, metadata)
        await backupArchive.init()
        this.backupArchives.set(fullPath, backupArchive)
      } catch (error) {
        console.warn(`Issue loading ${metadata.xva ?? metadata.vhds}`, { json: fullPath, backup: metadata })
      }
    }
  }

  async getValidFiles({ prefix = false }) {
    return this.files.filter(file => {
      file.endsWith('cache.json.gz')
    })
  }

  async check() {
    const allUsedFiles = Array.from(this.backupArchives.values()).flatMap(archive =>
      archive.getValidFiles({ prefix: true })
    )
    const orphans = []
    for (const file of this.files.filter(file => !allUsedFiles.includes(file) && !file.endsWith('cache.json.gz'))) {
      orphans.push(file)
    }
    return { orphans, linked: allUsedFiles }
  }

  async clean() {
    const { orphans } = await this.check()
    for (const orphan of orphans) {
      this.#handler.unlink(orphan)
    }
  }

  async createBackupArchive(metadataPath: string, metadata: PartialBackupMetadata) {
    let backupArchive: VmBackupArchive
    try {
      if (metadata.mode == 'full') {
        backupArchive = new VmFullBackupArchive(this.#handler, this.rootPath, metadataPath, metadata)
      } else {
        backupArchive = new VmIncrementalBackupArchive(this.#handler)
      }
    } catch (error) {
      throw new Error(`Error trying to create backupArchive from ${metadataPath}`, { metadata })
    }
    await backupArchive.init()
    return backupArchive
  }
}
