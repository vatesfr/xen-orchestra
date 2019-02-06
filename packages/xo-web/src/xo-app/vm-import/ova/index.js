import find from 'lodash/find'
import forEach from 'lodash/forEach'
import fromEvent from 'promise-toolbox/fromEvent'
import xml2js from 'xml2js'
import { ensureArray } from 'utils'
import { readVmdkGrainTable } from 'xo-vmdk-to-vhd'

// ===================================================================

// See: http://opennodecloud.com/howto/2013/12/25/howto-ON-ovf-reference.html
// See: http://www.dmtf.org/sites/default/files/standards/documents/DSP0243_1.0.0.pdf
// See: http://www.dmtf.org/sites/default/files/standards/documents/DSP0243_2.1.0.pdf

// ===================================================================

const MEMORY_UNIT_TO_FACTOR = {
  k: 1024,
  m: 1048576,
  g: 1073741824,
  t: 1099511627776,
}

const RESOURCE_TYPE_TO_HANDLER = {
  // CPU.
  '3': (data, { 'rasd:VirtualQuantity': nCpus }) => {
    data.nCpus = +nCpus
  },
  // RAM.
  '4': (
    data,
    { 'rasd:AllocationUnits': unit, 'rasd:VirtualQuantity': quantity }
  ) => {
    data.memory = quantity * allocationUnitsToFactor(unit)
  },
  // Network.
  '10': (
    { networks },
    { 'rasd:AutomaticAllocation': enabled, 'rasd:Connection': name }
  ) => {
    if (enabled) {
      networks.push(name)
    }
  },
  // Disk.
  '17': (
    { disks },
    {
      'rasd:AddressOnParent': position,
      'rasd:Description': description = 'No description',
      'rasd:ElementName': name,
      'rasd:HostResource': resource,
    }
  ) => {
    const diskId = resource.match(/^(?:ovf:)?\/disk\/(.+)$/)
    const disk = diskId && disks[diskId[1]]

    if (disk) {
      disk.descriptionLabel = description
      disk.nameLabel = name
      disk.position = +position
    } else {
      // TODO: Log error in U.I.
      console.error(`No disk found: '${diskId}'.`)
    }
  },
}

const allocationUnitsToFactor = unit => {
  const intValue = unit.match(/\^([0-9]+)$/)
  return intValue != null
    ? Math.pow(2, intValue[1])
    : MEMORY_UNIT_TO_FACTOR[unit.charAt(0).toLowerCase()]
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

// ===================================================================
/* global FileReader */

async function readFileFragment(file, start = 0, end) {
  const reader = new FileReader()
  reader.readAsArrayBuffer(file.slice(start, end))
  return (await fromEvent(reader, 'loadend')).target.result
}

function parseTarHeader(header) {
  const fileName = Buffer.from(header.slice(0, 100))
    .toString('ascii')
    .split('\0')[0]
  if (fileName.length === 0) {
    return null
  }
  // https://stackoverflow.com/a/2511526/72637
  const sizeBuffer = Buffer.from(header.slice(124, 124 + 12))
  let fileSize = 0
  if (sizeBuffer[0] === 128) {
    // https://github.com/chrisdickinson/tar-parse/blob/master/header.js#L271
    // remove the head byte and go from low to high power.
    const array = [...sizeBuffer.slice(1)].reverse()
    array.forEach((value, index) => {
      fileSize += value * Math.pow(256, index)
    })
  } else fileSize = parseInt(sizeBuffer.slice(0, -1).toString('ascii'), 8)
  console.log(
    'fileSize',
    fileName,
    fileSize,
    'B',
    fileSize / Math.pow(1024, 3),
    'GB'
  )
  // normal files are either the char '0' (charcode 48) or the char null (charcode zero)
  const typeSlice = new Uint8Array(header.slice(156, 156 + 1))[0]
  const fileType = typeSlice === 0 ? '0' : String.fromCharCode(typeSlice)
  return { fileName, fileSize, fileType }
}

async function parseOVF(fileFragment) {
  const xmlString = Buffer.from(await readFileFragment(fileFragment)).toString()
  return new Promise((resolve, reject) =>
    xml2js.parseString(
      xmlString,
      { mergeAttrs: true, explicitArray: false },
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
        data.nameLabel = hardware.System['vssd:VirtualSystemIdentifier']
        data.descriptionLabel =
          (system.AnnotationSection && system.AnnotationSection.Annotation) ||
          (system.OperatingSystemSection &&
            system.OperatingSystemSection.Description)

        // Get disks.
        forEach(ensureArray(disks), disk => {
          const file = find(
            ensureArray(files),
            file => file['ovf:id'] === disk['ovf:fileRef']
          )
          const unit = disk['ovf:capacityAllocationUnits']

          data.disks[disk['ovf:diskId']] = {
            capacity:
              disk['ovf:capacity'] *
              ((unit && allocationUnitsToFactor(unit)) || 1),
            path: file && file['ovf:href'],
          }
        })

        // Get hardware info: CPU, RAM, disks, networks...
        forEach(ensureArray(hardware.Item), item => {
          const handler = RESOURCE_TYPE_TO_HANDLER[item['rasd:ResourceType']]
          if (!handler) {
            return
          }
          handler(data, item)
        })

        // Remove disks which not have a position.
        // (i.e. no info in hardware.Item section.)
        filterDisks(data.disks)
        resolve(data)
      }
    )
  )
}

// tar spec: https://www.gnu.org/software/tar/manual/html_node/Standard.html
async function parseTarFile(file) {
  document.getElementsByTagName('body')[0].style.cursor = 'wait'
  try {
    let offset = 0
    const HEADER_SIZE = 512
    let data = { tables: {} }
    while (offset + HEADER_SIZE <= file.size) {
      const header = parseTarHeader(
        await readFileFragment(file, offset, offset + HEADER_SIZE)
      )
      offset += HEADER_SIZE
      if (header === null) {
        break
      }
      // remove mac os X forks https://stackoverflow.com/questions/8766730/tar-command-in-mac-os-x-adding-hidden-files-why
      if (
        header.fileType === '0' &&
        !header.fileName.toLowerCase().startsWith('./._')
      ) {
        if (header.fileName.toLowerCase().endsWith('.ovf')) {
          const res = await parseOVF(
            file.slice(offset, offset + header.fileSize)
          )
          data = { ...data, ...res }
        }
        if (header.fileName.toLowerCase().endsWith('.vmdk')) {
          const fileSlice = file.slice(offset, offset + header.fileSize)
          const readFile = async (start, end) =>
            readFileFragment(fileSlice, start, end)
          data.tables[header.fileName] = await readVmdkGrainTable(readFile)
        }
      }
      offset += Math.ceil(header.fileSize / 512) * 512
    }
    return data
  } finally {
    document.getElementsByTagName('body')[0].style.cursor = 'auto'
  }
}

const parseOvaFile = async file => parseTarFile(file)

export { parseOvaFile as default }
