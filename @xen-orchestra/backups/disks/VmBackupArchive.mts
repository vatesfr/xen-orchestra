import { PartialBackupMetadata } from './DiskLineage.types.mts'
import RemoteHandlerAbstract from '../../fs/src/abstract'

export abstract class AbstractVmBackupArchive {
  handler: RemoteHandlerAbstract
  metadataPath: string
  metadata: PartialBackupMetadata
  rootPath: string

  constructor(handler: RemoteHandlerAbstract, rootPath: string, metadataPath: string, metadata: PartialBackupMetadata) {
    this.handler = handler
    this.metadataPath = metadataPath
    this.metadata = metadata
    this.rootPath = rootPath
  }

  async init() {
    throw new Error('Not implemented')
  }

  async check() {
    throw new Error('Not implemented')
  }

  async clear() {
    throw new Error('Not implemented')
  }

  getValidFiles({ prefix = false }) {
    throw new Error('Not implemented')
  }
}
