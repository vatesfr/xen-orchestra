import { RandomDiskPassthrough, FileAccessor, RawDisk, RandomAccessDisk } from '@xen-orchestra/disk-transform'
import { VmdkCowd } from './VmdkCowd.mjs'
import { VmdkSeSparse } from './VmdkSeSparse.mjs'
import { parseVMDKDescriptor, VMDKDescriptor } from './vmdkDescriptor.mjs'
import { dirname, join } from 'path'

/**
 * read the descriptor and instantiate the right type of vmdk
 */

export class VmdkDisk extends RandomDiskPassthrough {
  #accessor: FileAccessor
  #vmdkMetadataPath: any
  #vmdkDescriptor?: VMDKDescriptor

  constructor(accessor: FileAccessor, vmdkPath: any) {
    super(undefined)
    this.#accessor = accessor
    this.#vmdkMetadataPath = vmdkPath
  }

  instantiateParent(): RandomAccessDisk {
    if (this.#vmdkDescriptor === undefined) {
      throw new Error('Call init before opening parent ')
    }
    const targetPath = join(dirname(this.#vmdkMetadataPath), this.#vmdkDescriptor.parentFileNameHint)
    console.log('instantiate parent ', targetPath)
    return new VmdkDisk(this.#accessor, targetPath)
  }
  async openSource(): Promise<RandomAccessDisk> {
    // read the start of the vmdk file
    // extract the descriptor
    // depending on the descriptor type

    const size = await this.#accessor.getSize(this.#vmdkMetadataPath)
    if (size > 1024) {
      throw new Error('reading from monolithic file is not implemnted yet')
    }
    const content = (await this.#accessor.readFile(this.#vmdkMetadataPath)).toString('utf8')

    const vmdkDescriptor = parseVMDKDescriptor(content)
    this.#vmdkDescriptor = vmdkDescriptor
    const extent = vmdkDescriptor.extents[0]
    if (extent.offset) {
      throw new Error('reading from monolithic file is not implemnted yet')
    }

    let vmdk: RandomAccessDisk
    const targetPath = join(dirname(this.#vmdkMetadataPath), extent.fileName)
    switch (extent.type) {
      case 'VMFS': //raw
        vmdk = new RawDisk(this.#accessor, targetPath, 2 * 1024 * 1024)
        break
      case 'VMFSSPARSE': //cowd
        if (!vmdkDescriptor.parentFileNameHint) {
          throw new Error(`no parentFileNameHint found in ${content}`)
        }
        vmdk = new VmdkCowd(this.#accessor, targetPath)
        break
      case 'SESPARSE':
        if (!vmdkDescriptor.parentFileNameHint) {
          throw new Error(`no parentFileNameHint found in ${content}`)
        }
        vmdk = new VmdkSeSparse(this.#accessor, targetPath)
        break
      case 'SPARSE': // stream optimized , also check createType
        throw new Error('streamoptimized not supported')
      default:
        throw new Error(`type${extent.type} not supported`)
    }
    await vmdk.init() 
    return vmdk
  }
}
