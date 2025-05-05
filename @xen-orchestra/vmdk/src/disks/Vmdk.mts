import { RandomDiskPassthrough, FileAccessor, RawDisk, RandomAccessDisk } from '@xen-orchestra/disk-transform'
import { VmdkCowd } from './VmdkCowd.mjs'
import { VmdkSeSparse } from './VmdkSeSparse.mjs'

/**
 * read the descriptor and instantiate the right type of vmdk
 */

export class VmdkDisk extends RandomDiskPassthrough {
  #accessor: FileAccessor
  #path: string
  #parent: VmdkDisk | undefined

  get parent(): VmdkDisk | undefined {
    return this.#parent
  }

  constructor(accessor: FileAccessor, path: string, parent?: VmdkDisk) {
    super(undefined)
    this.#accessor = accessor
    this.#path = path
    this.#parent = parent
  }

  async openSource(): Promise<RandomAccessDisk> {
    // read the start of the vmdk file
    // extract the descriptor
    // depending on the descriptor type

    const descriptor = await this.#accessor.open(this.#path)
    let buffer = Buffer.alloc(1024, 0)
    await this.#accessor.read(descriptor, buffer, 0)
    const metadata = buffer.toString()
    await this.#accessor.close(descriptor)

    // Parse the descriptor to find the type
    const createTypeMatch = metadata.match(/createType="([^"]+)"/)
    const createType = createTypeMatch ? createTypeMatch[1] : null

    const parentFileNameHintMatch = metadata.match(/createType="([^"]+)"/)
    const parentFileNameHint = parentFileNameHintMatch ? parentFileNameHintMatch[1][0] : null

    if (!createType) {
      throw new Error('Unable to determine VMDK type: createType not found in descriptor.')
    }

    // check if the vmdk is monolithic or if it reference another
    // by looking for a line RW 4192256 SPARSE "disk-flat.vmdk"
    // in theory we could read a vmdk file only by checking the flags
    // but in pracice there are some differences and constants
    const extentMatches = [...metadata.matchAll(/([A-Z]+) ([0-9]+) ([A-Z]+) "(.*)" ?(.*)$/g)]
    if (extentMatches.length !== 0) {
      throw new Error(`No extent found in descriptor ${metadata}`)
    }
    if (extentMatches.length > 1) {
      throw new Error(`${extentMatches.length} found in descriptor ${metadata}`)
    }
    const [, access, sizeSectors, type, name, offset] = extentMatches[0]
    if (offset) {
      throw new Error('reading from monolithic file is not implemnted yet')
    }

    let vmdk: RandomAccessDisk
    switch (type) {
      case 'VMFS': //raw
        vmdk = new RawDisk(this.#accessor, this.#path, 2 * 1024 * 1024)
        break
      case 'VMFSSPARSE': //cowd
        if (parentFileNameHint === null) {
          throw new Error(`no parentFileNameHint found in ${metadata}`)
        }
        if (this.#parent === undefined) {
          throw new Error(`no parent gven for a delta vmdka`)
        }
        vmdk = new VmdkCowd(this.#accessor, this.#path, this.#parent)
        break
      case 'SESPARSE':
        if (parentFileNameHint === null) {
          throw new Error(`no parentFileNameHint found in ${metadata}`)
        }
        if (this.#parent === undefined) {
          throw new Error(`no parent gven for a delta vmdka`)
        }
        vmdk = new VmdkSeSparse(this.#accessor, this.#path, this.#parent)
        break
      case 'SPARSE': // stream optimized , also check createType
        throw new Error('streamoptimized not supported')
      default:
        throw new Error(`type${type} not supported`)
    }

    return vmdk
  }
}
