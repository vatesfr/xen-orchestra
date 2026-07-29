import { basename, dirname } from 'node:path'

import tar from 'tar-stream'
import * as uuid from 'uuid'
import { Constants, VhdAbstract, VhdDirectory, VhdFile } from 'vhd-lib'

// a valid footer of a 2
export const VHDFOOTER = {
  cookie: 'conectix',
  features: 2,
  fileFormatVersion: 65536,
  dataOffset: 512,
  timestamp: 0,
  creatorApplication: 'caml',
  creatorVersion: 1,
  creatorHostOs: 0,
  originalSize: 53687091200,
  currentSize: 53687091200,
  diskGeometry: { cylinders: 25700, heads: 16, sectorsPerTrackCylinder: 255 },
  diskType: 3,
  checksum: 4294962945,
  uuid: Buffer.from('d8dbcad85265421e8b298d99c2eec551', 'utf-8'),
  saved: '',
  hidden: '',
  reserved: '',
}
export const VHDHEADER = {
  cookie: 'cxsparse',
  dataOffset: undefined,
  tableOffset: 2048,
  headerVersion: 65536,
  maxTableEntries: 25600,
  blockSize: 2097152,
  checksum: 4294964241,
  parentUuid: null,
  parentTimestamp: 0,
  reserved1: 0,
  parentUnicodeName: '',
  parentLocatorEntry: [
    {
      platformCode: 0,
      platformDataSpace: 0,
      platformDataLength: 0,
      reserved: 0,
      platformDataOffset: 0,
    },
    {
      platformCode: 0,
      platformDataSpace: 0,
      platformDataLength: 0,
      reserved: 0,
      platformDataOffset: 0,
    },
    {
      platformCode: 0,
      platformDataSpace: 0,
      platformDataLength: 0,
      reserved: 0,
      platformDataOffset: 0,
    },
    {
      platformCode: 0,
      platformDataSpace: 0,
      platformDataLength: 0,
      reserved: 0,
      platformDataOffset: 0,
    },
    {
      platformCode: 0,
      platformDataSpace: 0,
      platformDataLength: 0,
      reserved: 0,
      platformDataOffset: 0,
    },
    {
      platformCode: 0,
      platformDataSpace: 0,
      platformDataLength: 0,
      reserved: 0,
      platformDataOffset: 0,
    },
    {
      platformCode: 0,
      platformDataSpace: 0,
      platformDataLength: 0,
      reserved: 0,
      platformDataOffset: 0,
    },
    {
      platformCode: 0,
      platformDataSpace: 0,
      platformDataLength: 0,
      reserved: 0,
      platformDataOffset: 0,
    },
  ],
  reserved2: '',
}

export const uniqueId = () => uuid.v1()
export const uniqueIdBuffer = () => uuid.v1({}, Buffer.alloc(16))

/**
 * Write a synthetic VHD, as a file, a directory or an alias.
 *
 * @param {import('@xen-orchestra/fs').RemoteHandlerAbstract} handler
 * @param {string} path
 * @param {{ blocks?: number[], header?: object, footer?: object, mode?: 'directory', useAlias?: boolean }} opts
 * @returns {Promise<VhdFile|VhdDirectory>} the created VHD, whose `footer.uuid` can be used to chain children
 */
export async function generateVhd(handler, path, opts = {}) {
  let vhd

  let dataPath = path
  if (opts.useAlias) {
    await handler.mkdir(dirname(path) + '/data/')
    dataPath = dirname(path) + '/data/' + basename(path)
  }
  if (opts.mode === 'directory') {
    await handler.mkdir(dataPath)
    vhd = new VhdDirectory(handler, dataPath)
  } else {
    const fd = await handler.openFile(dataPath, 'wx')
    vhd = new VhdFile(handler, fd)
  }

  vhd.header = { ...VHDHEADER, ...opts.header }
  vhd.footer = { ...VHDFOOTER, ...opts.footer, uuid: uniqueIdBuffer() }

  if (vhd.header.parentUuid) {
    vhd.footer.diskType = Constants.DISK_TYPES.DIFFERENCING
  } else {
    vhd.footer.diskType = Constants.DISK_TYPES.DYNAMIC
  }

  if (opts.useAlias === true) {
    await VhdAbstract.createAlias(handler, path + '.alias.vhd', dataPath)
  }

  if (opts.blocks) {
    for (const blockId of opts.blocks) {
      await vhd.writeEntireBlock({ id: blockId, buffer: Buffer.alloc(2 * 1024 * 1024 + 512, blockId) })
    }
  }
  await vhd.writeBlockAllocationTable()
  await vhd.writeHeader()
  await vhd.writeFooter()
  return vhd
}

/**
 * The smallest tar archive that `isValidXva` accepts as an XVA.
 *
 * @returns {Promise<Buffer>}
 */
export async function createMinimalXva() {
  const pack = tar.pack()
  pack.entry({ name: 'ova.xml' }, '<value><struct/></value>')
  pack.finalize()

  const chunks = []
  for await (const chunk of pack) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}
