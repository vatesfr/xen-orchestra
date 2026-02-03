import { FileHandler } from '@xen-orchestra/disk-transform'
import { FullBackup } from './FullBackup.mts'
import type { PartialBackupMetadata, IBackupLineage } from './DiskLineage.types.mts'
import { resolve } from 'node:path'
import { RemoteDisk } from './RemoteDisk.mjs'

export class FullBackupLineage implements IBackupLineage {
  isChecked: Boolean
  handler: FileHandler
  basePath: string // xo-vm-backups/VMUUID/
  backups: Map<string, FullBackup> // backupPath -> backup

  metadatas: Map<string, string> // jsonPath -> backupPath
  checksumFiles: Set<string>

  orphanDisks: Set<string>
  orphanMetadatas: Set<string>

  constructor(handler: FileHandler, basePath: string) {
    this.isChecked = false
    this.handler = handler
    this.basePath = basePath
    this.backups = new Map()
    this.checksumFiles = new Set()
    this.orphanDisks = new Set()
    this.orphanMetadatas = new Set()
    this.metadatas = new Map()
  }

  async init() {
    this.isChecked = false
    const files = await this.handler.list(this.basePath, { prependDir: true })

    for (const fullPath of files) {
      if (fullPath.endsWith('.xva')) {
        const backup = new FullBackup(this.handler, fullPath)
        await backup.init()
        this.backups.set(fullPath, backup)
        this.orphanDisks.add(fullPath)
      } else if (fullPath.endsWith('.xva.checksum')) {
        this.checksumFiles.add(fullPath)
      } else if (fullPath.endsWith('.json')) {
        const metadata = JSON.parse(await this.handler.readFile(fullPath)) satisfies PartialBackupMetadata
        if (metadata.mode == 'full') {
          this.metadatas.set(fullPath, resolve('/', this.basePath, metadata.xva!))
          this.orphanMetadatas.add(fullPath)
        }
      }
    }
  }

  async check() {
    if (!this.isChecked) {
      const brokenFullBackups: Set<String> = new Set()
      for (const [fullBackupPath, backup] of this.backups.entries()) {
        if (await backup.check()) {
          brokenFullBackups.add(fullBackupPath)
        }
      }

      for (const [jsonPath, backupPath] of this.metadatas.entries()) {
        console.log('  ', backupPath)
        // keep only unlinked disk to delete them
        if (this.backups.has(backupPath)) {
          this.orphanDisks.delete(backupPath)
          // keep json if disk missing
        } else {
          this.orphanMetadatas.add(jsonPath)
          console.warn('the XVA linked to the backup is missing', { backup: jsonPath, xva: backupPath })
        }
      }
      this.isChecked = true
    }
  }

  // Phase 3: Clean
  async clean() {
    this.check()
    const deleted = new Set<string>()

    // Compatibility: delete checksum files added from 5.110 to 5.113
    for (const checksumFile of this.checksumFiles) {
      try {
        await this.handler.unlink(checksumFile)
        deleted.add(checksumFile)
      } catch (error) {
        console.warn(`Error trying to delete ${checksumFile}`)
      }
    }

    for (const diskPath in this.orphanDisks) {
      try {
        await this.handler.unlink(diskPath)
        deleted.add(diskPath)
      } catch (error) {
        console.warn(`Error trying to delete ${diskPath}`)
      }
    }

    for (const jsonPath in this.orphanMetadatas) {
      try {
        await this.handler.unlink(jsonPath)
        deleted.add(jsonPath)
      } catch (error) {
        console.warn(`Error trying to delete ${jsonPath}`)
      }
    }
    return deleted
  }

  // Getters
  getBackup(diskPath: string) {
    return this.backups.get(diskPath)
  }
  getOrphanDisks() {
    return this.orphanDisks
  }
  getLinkedBackups(): Map<string, RemoteDisk> {
    return this.backups
  }
}
