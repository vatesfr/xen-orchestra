import find from 'lodash/find'
import forEach from 'lodash/forEach'
import tar from 'tar-stream'
import xml2js from 'xml2js'
import {
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
    'rasd:VirtualQuantity': [ nCpus ]
  }) => {
    data.nCpus = +nCpus
  },
  // RAM.
  '4': (data, {
    'rasd:AllocationUnits': [ unit ],
    'rasd:VirtualQuantity': [ quantity ]
  }) => {
    data.memory = quantity * allocationUnitsToFactor(unit)
  },
  // Network.
  '10': ({ networks }, {
    'rasd:AutomaticAllocation': [ enabled ],
    'rasd:Connection': [ name ]
  }) => {
    if (enabled) {
      networks.push(name)
    }
  },
  // Disk.
  '17': ({ disks }, {
    'rasd:AddressOnParent': [ position ],
    'rasd:Description': [ description ],
    'rasd:ElementName': [ name ],
    'rasd:HostResource': [ resource ]
  }) => {
    let diskId
    if ((diskId = resource.match(/^\/disk\/(.+)$/))) {
      diskId = diskId[1]
    }

    const disk = disks[diskId]
    if (disk) {
      disk.descriptionLabel = description
      disk.name = name
      disk.position = +position
    }
  }
}

const allocationUnitsToFactor = unit => {
  let intValue
  return (intValue = unit.match(/\^([0-9]+)$/))
    ? Math.pow(2, intValue[1])
    : MEMORY_UNIT_TO_FACTOR[unit.charAt(0).toLowerCase()]
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
      stream.on('end', cb)

      // Not a XML file.
      const extIndex = name.lastIndexOf('.')
      if (extIndex === -1 || name.substring(extIndex + 1) !== 'ovf') {
        stream.resume()
        return
      }

      // XML file.
      streamToString(stream).then(xmlString => {
        xml2js.parseString(xmlString, (err, res) => {
          if (err) {
            reject(err)
            return
          }

          const {
            Envelope: {
              DiskSection: [ { Disk: disks } ],
              References: [ { File: files } ],
              VirtualSystem: [ system ]
            }
          } = res

          const data = {
            disks: {},
            networks: []
          }
          const hardware = system.VirtualHardwareSection[0]

          // Get VM name/description.
          data.nameLabel = hardware.System[0]['vssd:VirtualSystemIdentifier'][0]
          data.descriptionLabel =
            (system.AnnotationSection && system.AnnotationSection[0].Annotation[0]) ||
            (system.OperatingSystemSection && system.OperatingSystemSection[0].Description[0])

          // Get disks.
          forEach(disks, ({ $: disk }) => {
            const file = find(files, ({ $: file }) => file['ovf:id'] === disk['ovf:fileRef'])
            const unit = disk['ovf:capacityAllocationUnits']

            data.disks[disk['ovf:diskId']] = {
              capacity: disk['ovf:capacity'] * ((unit && allocationUnitsToFactor(unit)) || 1),
              path: file && file.$['ovf:href']
            }
          })

          // Get hardware info: CPU, RAM, disks, networks...
          forEach(hardware.Item, item => {
            const handler = RESOURCE_TYPE_TO_HANDLER[item['rasd:ResourceType']]
            if (!handler) {
              return
            }
            handler(data, item)
          })

          // Done!
          resolve(data)
        })
      })
    })

    stream.pipe(extract)
  })
)
export { parseOvaFile as default }
