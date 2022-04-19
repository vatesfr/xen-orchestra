import assert from 'assert'
import find from 'lodash/find'
import forEach from 'lodash/forEach'
import pako from 'pako'
import sum from 'lodash/sum'
import xml2js, { processors } from 'xml2js'

import { readVmdkGrainTable } from '.'
import { suppressUnhandledRejection } from './util'

/********
 *
 * THIS FILE HAS TO WORK IN BOTH THE BROWSER AND NODE
 *
 ********/

// See: http://opennodecloud.com/howto/2013/12/25/howto-ON-ovf-reference.html
// See: http://www.dmtf.org/sites/default/files/standards/documents/DSP0243_1.0.0.pdf
// See: http://www.dmtf.org/sites/default/files/standards/documents/DSP0243_2.1.0.pdf

const MEMORY_UNIT_TO_FACTOR = {
  k: 1024,
  m: 1048576,
  g: 1073741824,
  t: 1099511627776,
}
const RESOURCE_TYPE_TO_HANDLER = {
  // CPU.
  3: (data, { VirtualQuantity: nCpus }) => {
    data.nCpus = +nCpus
  },
  // RAM.
  4: (data, { AllocationUnits: unit, VirtualQuantity: quantity }) => {
    data.memory = quantity * allocationUnitsToFactor(unit)
  },
  // Network.
  10: ({ networks }, { AutomaticAllocation: enabled, Connection: name }) => {
    if (enabled) {
      networks.push(name)
    }
  },
  // Disk.
  17: (
    { disks },
    {
      Address: address,
      AddressOnParent: position,
      Description: description = 'No description',
      ElementName: name,
      // OVA 2.0 uses caption
      Caption: caption = name,
      HostResource: resource,
    }
  ) => {
    const diskId = resource.match(/^(?:ovf:)?\/disk\/(.+)$/)
    const disk = diskId && disks[diskId[1]]
    if (position === undefined && address !== undefined) {
      // remove blanks
      let parsed = address.replace(/\s+/g, '')
      // expecting "{type=drive,bus=0,controller=0,target=0,unit=0}"
      if (parsed[0] === '{' && parsed[parsed.length - 1] === '}') {
        parsed = parsed.substring(1, parsed.length - 1)
        // "type=drive,bus=0,controller=0,target=0,unit=0"
        parsed = parsed.split(',')
        // ["type=drive", "bus=0", "controller=0", "target=0", "unit=0"]
        parsed = Object.fromEntries(parsed.map(couple => couple.split('=')))
        // {type:"drive", bus:"0", controller:"0", target:"0",unit:"0"]
        // 'target' seems to be the field we want
        // https://www.ibm.com/support/knowledgecenter/linuxonibm/com.ibm.linux.z.ldva/ldva_r_XML_addressHostdev.html
        if ('target' in parsed) {
          position = +parsed.target
        }
      }
    }
    if (position === undefined) {
      position = 0
    }
    if (disk) {
      disk.descriptionLabel = description
      disk.nameLabel = caption
      disk.position = +position
    } else {
      // TODO: Log error in U.I.
      console.error(`No disk found: '${diskId}'.`)
    }
  },
}

function parseTarHeader(header, stringDeserializer) {
  const fileName = stringDeserializer(header.slice(0, 100), 'ascii').split('\0')[0]
  if (fileName.length === 0) {
    return null
  }
  const sizeBuffer = header.slice(124, 124 + 12)
  // size encoding: https://codeistry.wordpress.com/2014/08/14/how-to-parse-a-tar-file/
  let fileSize = 0
  // If the leading byte is 0x80 (128), the non-leading bytes of the field are concatenated in big-endian order,
  // with the result being a positive number expressed in binary form.
  //
  // Source: https://www.gnu.org/software/tar/manual/html_node/Extensions.html
  if (new Uint8Array(sizeBuffer)[0] === 128) {
    for (const byte of new Uint8Array(sizeBuffer.slice(1))) {
      fileSize *= 256
      fileSize += byte
    }
  } else {
    fileSize = parseInt(stringDeserializer(sizeBuffer.slice(0, 11), 'ascii'), 8)
  }

  return { fileName, fileSize }
}

export class ParsableFile {
  /** returns a ParsableFile */
  slice(start, end) {}

  /** reads the fragment, returns an ArrayBuffer */
  async read() {}
}

export const ensureArray = value => {
  if (value === undefined) {
    return []
  }

  return Array.isArray(value) ? value : [value]
}

const allocationUnitsToFactor = unit => {
  const intValue = unit.match(/\^([0-9]+)$/)
  return intValue != null ? Math.pow(2, intValue[1]) : MEMORY_UNIT_TO_FACTOR[unit.charAt(0).toLowerCase()]
}

const filterDisks = disks => {
  for (const diskId in disks) {
    if (disks[diskId].position == null) {
      // TODO: Log error in U.I.
      console.error(`No position specified for '${diskId}'.`)
      delete disks[diskId]
    }
  }
}

export async function parseOVF(fileFragment, stringDeserializer) {
  const xmlString = stringDeserializer(await fileFragment.read(), 'utf-8')
  return new Promise((resolve, reject) =>
    xml2js.parseString(
      xmlString,
      {
        mergeAttrs: true,
        explicitArray: false,
        tagNameProcessors: [processors.stripPrefix],
        attrNameProcessors: [processors.stripPrefix],
      },
      (err, res) => {
        if (err) {
          reject(err)
          return
        }

        const {
          Envelope: {
            DiskSection: { Disk: disks },
            References: { File: files },
            VirtualSystem: system,
          },
        } = res

        const data = {
          disks: {},
          networks: [],
        }
        const hardware = system.VirtualHardwareSection

        // Get VM name/description.
        data.nameLabel = hardware.System.VirtualSystemIdentifier
        data.descriptionLabel =
          (system.AnnotationSection && system.AnnotationSection.Annotation) ||
          (system.OperatingSystemSection && system.OperatingSystemSection.Description)

        // Get disks.
        forEach(ensureArray(disks), disk => {
          const file = find(ensureArray(files), file => file.id === disk.fileRef)
          const unit = disk.capacityAllocationUnits

          data.disks[disk.diskId] = {
            capacity: disk.capacity * ((unit && allocationUnitsToFactor(unit)) || 1),
            path: file && file.href,
            compression: file && file.compression,
          }
        })
        // Get hardware info: CPU, RAM, disks, networks...
        const handleItem = item => {
          const handler = RESOURCE_TYPE_TO_HANDLER[item.ResourceType]
          if (!handler) {
            return
          }
          handler(data, item)
        }
        forEach(ensureArray(hardware.Item), handleItem)
        forEach(ensureArray(hardware.StorageItem), handleItem)
        forEach(ensureArray(hardware.EthernetPortItem), handleItem)
        // Remove disks which not have a position.
        // (i.e. no info in hardware.Item section.)
        filterDisks(data.disks)
        resolve(data)
      }
    )
  )
}

const GZIP_CHUNK_SIZE = 4 * 1024 * 1024

// start and end are negative numbers
// used with streamOptimized format where only the footer has the directory address filled
async function parseGzipFromEnd(start, end, fileSlice, header) {
  const l = end - start
  const chunks = []
  let savedSize = 0
  let currentDeflatedPos = 0
  const inflate = new pako.Inflate()
  while (currentDeflatedPos < header.fileSize) {
    const slice = fileSlice.slice(currentDeflatedPos, currentDeflatedPos + GZIP_CHUNK_SIZE)
    const compressed = await slice.read()
    inflate.push(compressed, pako.Z_SYNC_FLUSH)
    const chunk = inflate.result.slice()
    chunks.push({ pos: currentDeflatedPos, buffer: chunk })
    savedSize += chunk.length
    if (savedSize - chunks[0].buffer.length >= l) {
      savedSize -= chunks[0].buffer.length
      chunks.shift()
    }
    currentDeflatedPos += GZIP_CHUNK_SIZE
  }
  let resultBuffer = new Uint8Array(sum(chunks.map(c => c.buffer.length)))
  let index = 0
  chunks.forEach(c => {
    resultBuffer.set(c.buffer, index)
    index += c.buffer.length
  })
  resultBuffer = resultBuffer.slice(start, end)
  return resultBuffer.buffer
}

/**
 *
 * @param parsableFile: ParsableFile
 * @param stringDeserializer function (ArrayBuffer, encoding) => String
 * @param skipVmdk if true avoid parsing the VMDK file tables
 * @returns {Promise<{tables: {}}>}
 */
export async function parseOVAFile(parsableFile, stringDeserializer, skipVmdk = false) {
  let offset = 0
  const HEADER_SIZE = 512
  let data = { tables: {} }
  while (true) {
    const header = parseTarHeader(await parsableFile.slice(offset, offset + HEADER_SIZE).read(), stringDeserializer)
    offset += HEADER_SIZE
    if (header === null) {
      break
    }
    const fileSlice = parsableFile.slice(offset, offset + header.fileSize)
    fileSlice.fileName = header.fileName
    if (!(header.fileName.startsWith('PaxHeader/') || header.fileName.startsWith('.'))) {
      if (header.fileName.toLowerCase().endsWith('.ovf')) {
        const res = await parseOVF(fileSlice, stringDeserializer)
        data = { ...data, ...res }
      }
      if (!skipVmdk && header.fileName.toLowerCase().endsWith('.vmdk')) {
        const readFile = async (start, end) => fileSlice.slice(start, end).read()
        readFile.fileName = header.fileName
        data.tables[header.fileName] = suppressUnhandledRejection(readVmdkGrainTable(readFile))
      }
    }
    if (!skipVmdk && header.fileName.toLowerCase().endsWith('.vmdk.gz')) {
      let forwardsInflater = new pako.Inflate()

      const readFile = async (start, end) => {
        // if next read is further down the stream than previous read, re-uses the previous zstream
        async function parseGzipFromStart(start, end, fileSlice) {
          const chunks = []
          const resultStart = () => forwardsInflater.strm.total_out - forwardsInflater.result.length
          if (forwardsInflater.result != null && start < resultStart()) {
            // the block we are reading starts before the last decompressed chunk, reset stream
            forwardsInflater = new pako.Inflate()
          }
          let isLast = false
          while (true) {
            if (forwardsInflater.strm.total_out > start) {
              let chunk = forwardsInflater.result
              if (resultStart() < start) {
                chunk = chunk.slice(start - resultStart())
              }
              if (forwardsInflater.strm.total_out > end) {
                chunk = chunk.slice(0, -(forwardsInflater.strm.total_out - end))
                isLast = true
              }
              chunks.push(chunk)
            }
            if (isLast) {
              // don't move the stream forwards if we took our last chunk
              // gives the next read operation an opportunity to read from the same position
              break
            }
            const slice = fileSlice.slice(
              forwardsInflater.strm.total_in,
              forwardsInflater.strm.total_in + GZIP_CHUNK_SIZE
            )
            forwardsInflater.push(await slice.read(), pako.Z_SYNC_FLUSH)
          }
          const resultBuffer = new Uint8Array(sum(chunks.map(c => c.length)))
          let index = 0
          chunks.forEach(c => {
            resultBuffer.set(c, index)
            index += c.length
          })
          assert.strictEqual(resultBuffer.buffer.byteLength, end - start)
          return resultBuffer.buffer
        }

        if (start === end) {
          return new Uint8Array(0)
        }
        if (start >= 0 && end >= 0) {
          return parseGzipFromStart(start, end, fileSlice)
        } else if (start < 0 && end < 0) {
          return parseGzipFromEnd(start, end, fileSlice, header)
        }
      }
      readFile.fileName = header.fileName
      data.tables[header.fileName] = suppressUnhandledRejection(readVmdkGrainTable(readFile))
    }
    offset += Math.ceil(header.fileSize / 512) * 512
  }
  return data
}
