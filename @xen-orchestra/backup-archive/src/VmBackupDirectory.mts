
import RemoteHandlerAbstract from '@xen-orchestra/fs'
import { basename, normalize } from '@xen-orchestra/fs/path'
import { VmFullBackupArchive } from './VmFullBackupArchive.mjs'
import { IVmBackupInterface, PartialBackupMetadata } from './VmBackup.types.mjs'

const FILES_TO_KEEP = ['cache.json.gz']

export class VmBackupDirectory implements IVmBackupInterface {
  handler: RemoteHandlerAbstract
  rootPath: string
  files: Array<string>
  orphans: Set<string>
  backupArchives: Map<string, IVmBackupInterface>

  constructor(handler: RemoteHandlerAbstract, vmBackupPath: string) {
    this.handler = handler
    this.rootPath = vmBackupPath
    this.files = []
    this.orphans = new Set()
    this.backupArchives = new Map()
  }

  async init() {
    this.files = (await this.handler.list(this.rootPath, { prependDir: true })).map(file=>normalize(file))
    console.log(this.files)
    for (const fullPath of this.files.filter(path => path.endsWith('.json'))) {
      const metadata = JSON.parse(await this.handler.readFile(fullPath)) satisfies PartialBackupMetadata
      try {
        const backupArchive = await this.createBackupArchive(fullPath, metadata)
        this.backupArchives.set(fullPath, backupArchive)
      } catch (error) {
        console.warn(`Issue loading ${metadata.xva ?? metadata.vhds}`, { json: fullPath, backup: metadata })
      }
    }
  }

  getValidFiles({ prefix = false }) {
    const files = this.files.filter(file => FILES_TO_KEEP.some(pattern => file.endsWith(pattern)))
    return prefix ? files : files.map(file => basename(file))
  }

  async check() {
    const allUsedFiles = Array.from(this.backupArchives.values()).flatMap(archive =>
      archive.getValidFiles({ prefix: true })
    )
    allUsedFiles.push(...this.getValidFiles({ prefix: true }))
    const orphans = []
    for (const file of this.files.filter(file => !allUsedFiles.includes(file))) {
      orphans.push(file)
    }
    return { orphans, linked: allUsedFiles }
  }

  async clean() {
    const { orphans } = await this.check()
    for (const orphan of orphans) {
      await this.handler.unlink(orphan)
    }
    return orphans
  }

  async createBackupArchive(metadataPath: string, metadata: PartialBackupMetadata) {
    let backupArchive: IVmBackupInterface
    try {
      if (metadata.mode == 'full') {
        backupArchive = new VmFullBackupArchive(this.handler, this.rootPath, metadataPath, metadata, normalize(metadata.xva!))
      } else {
        //@ts-ignore
        backupArchive = new VmIncrementalBackupArchive(this.handler)
      }
    } catch (error) {
      console.warn(`Error trying to create backupArchive from ${metadataPath}`, { metadata })
      throw new Error(`Error trying to create backupArchive from ${metadataPath}`)
    }
    await backupArchive.init()
    return backupArchive
  }
}
