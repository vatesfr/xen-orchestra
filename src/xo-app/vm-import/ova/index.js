import find from 'lodash/find'
import forEach from 'lodash/forEach'
import tar from 'tar-stream'
import xml2js from 'xml2js'
import {
  ensureArray,
  htmlFileToStream,
  streamToString
} from 'utils'

// ===================================================================

// See: http://opennodecloud.com/howto/2013/12/25/howto-ON-ovf-reference.html
// See: http://www.dmtf.org/sites/default/files/standards/documents/DSP0243_1.0.0.pdf
// See: http://www.dmtf.org/sites/default/files/standards/documents/DSP0243_2.1.0.pdf

// ===================================================================

const MEMORY_UNIT_TO_FACTOR = {
  k: 1024,
  m: 1048576,
  g: 1073741824,
  t: 1099511627776
}

const RESOURCE_TYPE_TO_HANDLER = {
  // CPU.
  '3': (data, {
    'rasd:VirtualQuantity': nCpus
  }) => {
    data.nCpus = +nCpus
  },
  // RAM.
  '4': (data, {
    'rasd:AllocationUnits': unit,
    'rasd:VirtualQuantity': quantity
  }) => {
    data.memory = quantity * allocationUnitsToFactor(unit)
  },
  // Network.
  '10': ({ networks }, {
    'rasd:AutomaticAllocation': enabled,
    'rasd:Connection': name
  }) => {
    if (enabled) {
      networks.push(name)
    }
  },
  // Disk.
  '17': ({ disks }, {
    'rasd:AddressOnParent': position,
    'rasd:Description': description = 'No description',
    'rasd:ElementName': name,
    'rasd:HostResource': resource
  }) => {
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
  }
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

const parseOvaFile = file => (
  new Promise((resolve, reject) => {
    const stream = htmlFileToStream(file)
    const extract = tar.extract()

    stream.on('error', reject)

    // tar module can work with bad tar files...
    // So it's necessary to reject at end of stream.
    extract.on('finish', () => { reject(new Error('No ovf file found.')) })
    extract.on('error', reject)
    extract.on('entry', ({ name }, stream, cb) => {
      // Not a XML file.
      const extIndex = name.lastIndexOf('.')
      if (extIndex === -1 || name.substring(extIndex + 1) !== 'ovf') {
        stream.on('end', cb)
        stream.resume()
        return
      }

      // XML file.
      streamToString(stream).then(xmlString => {
        xml2js.parseString(xmlString, {
          mergeAttrs: true,
          explicitArray: false
        }, (err, res) => {
          if (err) {
            reject(err)
            return
          }

          const {
            Envelope: {
              DiskSection: { Disk: disks },
              References: { File: files },
              VirtualSystem: system
            }
          } = res

          const data = {
            disks: {},
            networks: []
          }
          const hardware = system.VirtualHardwareSection

          // Get VM name/description.
          data.nameLabel = hardware.System['vssd:VirtualSystemIdentifier']
          data.descriptionLabel =
            (system.AnnotationSection && system.AnnotationSection.Annotation) ||
            (system.OperatingSystemSection && system.OperatingSystemSection.Description)

          // Get disks.
          forEach(ensureArray(disks), disk => {
            const file = find(ensureArray(files), file => file['ovf:id'] === disk['ovf:fileRef'])
            const unit = disk['ovf:capacityAllocationUnits']

            data.disks[disk['ovf:diskId']] = {
              capacity: disk['ovf:capacity'] * ((unit && allocationUnitsToFactor(unit)) || 1),
              path: file && file['ovf:href']
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

          // Done!
          resolve(data)
          cb()
        })
      })
    })

    stream.pipe(extract)
  })
)
export { parseOvaFile as default }
