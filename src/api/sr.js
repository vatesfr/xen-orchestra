import {
  ensureArray,
  forEach,
  parseXml
} from '../utils'

// ===================================================================

export async function set ({
  sr,

  // TODO: use camel case.
  name_description: nameDescription,
  name_label: nameLabel
}) {
  await this.getXapi(sr).setSrProperties(sr._xapiId, {
    nameDescription,
    nameLabel
  })
}

set.params = {
  id: { type: 'string' },

  name_label: { type: 'string', optional: true },

  name_description: { type: 'string', optional: true }
}

set.resolve = {
  sr: ['id', 'SR', 'operate']
}

// -------------------------------------------------------------------

export async function scan ({SR}) {
  await this.getXapi(SR).call('SR.scan', SR._xapiRef)
}

scan.params = {
  id: { type: 'string' }
}

scan.resolve = {
  SR: ['id', 'SR', 'operate']
}

// -------------------------------------------------------------------

// TODO: find a way to call this "delete" and not destroy
export async function destroy ({SR}) {
  await this.getXapi(SR).call('SR.destroy', SR._xapiRef)
}

destroy.params = {
  id: { type: 'string' }
}

destroy.resolve = {
  SR: ['id', 'SR', 'administrate']
}

// -------------------------------------------------------------------

export async function forget ({SR}) {
  await this.getXapi(SR).call('SR.forget', SR._xapiRef)
}

forget.params = {
  id: { type: 'string' }
}

forget.resolve = {
  SR: ['id', 'SR', 'administrate']
}

// -------------------------------------------------------------------

export async function createIso ({
  host,
  nameLabel,
  nameDescription,
  path,
  type,
  user,
  password
}) {
  const xapi = this.getXapi(host)

  const deviceConfig = {}
  if (type === 'local') {
    deviceConfig.legacy_mode = 'true'
  } else if (type === 'smb') {
    path = path.replace(/\\/g, '/')
    deviceConfig.username = user
    deviceConfig.cifspassword = password
  }

  deviceConfig.location = path

  const srRef = await xapi.call(
    'SR.create',
    host._xapiRef,
    deviceConfig,
    '0', // SR size 0 because ISO
    nameLabel,
    nameDescription,
    'iso', // SR type ISO
    'iso', // SR content type ISO
    true,
    {}
  )

  const sr = await xapi.call('SR.get_record', srRef)
  return sr.uuid
}

createIso.params = {
  host: { type: 'string' },
  nameLabel: { type: 'string' },
  nameDescription: { type: 'string' },
  path: { type: 'string' },
  type: { type: 'string' },
  user: { type: 'string', optional: true },
  password: { type: 'string', optional: true }
}

createIso.resolve = {
  host: ['host', 'host', 'administrate']
}

// -------------------------------------------------------------------
// NFS SR

// This functions creates a NFS SR

export async function createNfs ({
  host,
  nameLabel,
  nameDescription,
  server,
  serverPath,
  nfsVersion
}) {
  const xapi = this.getXapi(host)

  const deviceConfig = {
    server,
    serverpath: serverPath
  }

  //  if NFS version given
  if (nfsVersion) {
    deviceConfig.nfsversion = nfsVersion
  }

  const srRef = await xapi.call(
    'SR.create',
    host._xapiRef,
    deviceConfig,
    '0',
    nameLabel,
    nameDescription,
    'nfs', // SR LVM over iSCSI
    'user', // recommended by Citrix
    true,
    {}
  )

  const sr = await xapi.call('SR.get_record', srRef)
  return sr.uuid
}

createNfs.params = {
  host: { type: 'string' },
  nameLabel: { type: 'string' },
  nameDescription: { type: 'string' },
  server: { type: 'string' },
  serverPath: { type: 'string' },
  nfsVersion: { type: 'string', optional: true }
}

createNfs.resolve = {
  host: ['host', 'host', 'administrate']
}

// -------------------------------------------------------------------
// Local LVM SR

// This functions creates a local LVM SR

export async function createLvm ({
  host,
  nameLabel,
  nameDescription,
  device
}) {
  const xapi = this.getXapi(host)

  const deviceConfig = {
    device
  }

  const srRef = await xapi.call(
    'SR.create',
    host._xapiRef,
    deviceConfig,
    '0',
    nameLabel,
    nameDescription,
    'lvm', // SR LVM
    'user', // recommended by Citrix
    false,
    {}
  )

  const sr = await xapi.call('SR.get_record', srRef)
  return sr.uuid
}

createLvm.params = {
  host: { type: 'string' },
  nameLabel: { type: 'string' },
  nameDescription: { type: 'string' },
  device: { type: 'string' }
}

createLvm.resolve = {
  host: ['host', 'host', 'administrate']
}

// -------------------------------------------------------------------
// This function helps to detect all NFS shares (exports) on a NFS server
// Return a table of exports with their paths and ACLs

export async function probeNfs ({
  host,
  server
}) {
  const xapi = this.getXapi(host)

  const deviceConfig = {
    server
  }

  let xml

  try {
    await xapi.call(
      'SR.probe',
      host._xapiRef,
      deviceConfig,
      'nfs',
      {}
    )

    throw new Error('the call above should have thrown an error')
  } catch (error) {
    if (error.code !== 'SR_BACKEND_FAILURE_101') {
      throw error
    }

    xml = parseXml(error.params[2])
  }

  const nfsExports = []
  forEach(ensureArray(xml['nfs-exports'].Export), nfsExport => {
    nfsExports.push({
      path: nfsExport.Path.trim(),
      acl: nfsExport.Accesslist.trim()
    })
  })

  return nfsExports
}

probeNfs.params = {
  host: { type: 'string' },
  server: { type: 'string' }
}

probeNfs.resolve = {
  host: ['host', 'host', 'administrate']
}

// -------------------------------------------------------------------
// ISCSI SR

// This functions creates a iSCSI SR

export async function createIscsi ({
  host,
  nameLabel,
  nameDescription,
  size,
  target,
  port,
  targetIqn,
  scsiId,
  chapUser,
  chapPassword
}) {
  const xapi = this.getXapi(host)

  const deviceConfig = {
    target,
    targetIQN: targetIqn,
    SCSIid: scsiId
  }

  // if we give user and password
  if (chapUser && chapPassword) {
    deviceConfig.chapUser = chapUser
    deviceConfig.chapPassword = chapPassword
  }

  //  if we give another port than default iSCSI
  if (port) {
    deviceConfig.port = port
  }

  const srRef = await xapi.call(
    'SR.create',
    host._xapiRef,
    deviceConfig,
    '0',
    nameLabel,
    nameDescription,
    'lvmoiscsi', // SR LVM over iSCSI
    'user', // recommended by Citrix
    true,
    {}
  )

  const sr = await xapi.call('SR.get_record', srRef)
  return sr.uuid
}

createIscsi.params = {
  host: { type: 'string' },
  nameLabel: { type: 'string' },
  nameDescription: { type: 'string' },
  target: { type: 'string' },
  port: { type: 'integer', optional: true },
  targetIqn: { type: 'string' },
  scsiId: { type: 'string' },
  chapUser: { type: 'string', optional: true },
  chapPassword: { type: 'string', optional: true }
}

createIscsi.resolve = {
  host: ['host', 'host', 'administrate']
}

// -------------------------------------------------------------------
// This function helps to detect all iSCSI IQN on a Target (iSCSI "server")
// Return a table of IQN or empty table if no iSCSI connection to the target

export async function probeIscsiIqns ({
  host,
  target: targetIp,
  port,
  chapUser,
  chapPassword
}) {
  const xapi = this.getXapi(host)

  const deviceConfig = {
    target: targetIp
  }

  // if we give user and password
  if (chapUser && chapPassword) {
    deviceConfig.chapUser = chapUser
    deviceConfig.chapPassword = chapPassword
  }

  //  if we give another port than default iSCSI
  if (port) {
    deviceConfig.port = port
  }

  let xml

  try {
    await xapi.call(
      'SR.probe',
      host._xapiRef,
      deviceConfig,
      'lvmoiscsi',
      {}
    )

    throw new Error('the call above should have thrown an error')
  } catch (error) {
    if (error.code === 'SR_BACKEND_FAILURE_141') {
      return []
    }
    if (error.code !== 'SR_BACKEND_FAILURE_96') {
      throw error
    }

    xml = parseXml(error.params[2])
  }

  const targets = []
  forEach(ensureArray(xml['iscsi-target-iqns'].TGT), target => {
    // if the target is on another IP adress, do not display it
    if (target.IPAddress.trim() === targetIp) {
      targets.push({
        iqn: target.TargetIQN.trim(),
        ip: target.IPAddress.trim()
      })
    }
  })

  return targets
}

probeIscsiIqns.params = {
  host: { type: 'string' },
  target: { type: 'string' },
  port: { type: 'integer', optional: true },
  chapUser: { type: 'string', optional: true },
  chapPassword: { type: 'string', optional: true }
}
probeIscsiIqns.resolve = {
  host: ['host', 'host', 'administrate']
}

// -------------------------------------------------------------------
// This function helps to detect all iSCSI ID and LUNs on a Target
//  It will return a LUN table

export async function probeIscsiLuns ({
  host,
  target: targetIp,
  port,
  targetIqn,
  chapUser,
  chapPassword
}) {
  const xapi = this.getXapi(host)

  const deviceConfig = {
    target: targetIp,
    targetIQN: targetIqn
  }

  // if we give user and password
  if (chapUser && chapPassword) {
    deviceConfig.chapUser = chapUser
    deviceConfig.chapPassword = chapPassword
  }

  //  if we give another port than default iSCSI
  if (port) {
    deviceConfig.port = port
  }

  let xml

  try {
    await xapi.call(
      'SR.probe',
      host._xapiRef,
      deviceConfig,
      'lvmoiscsi',
      {}
    )

    throw new Error('the call above should have thrown an error')
  } catch (error) {
    if (error.code !== 'SR_BACKEND_FAILURE_107') {
      throw error
    }

    xml = parseXml(error.params[2])
  }

  const luns = []
  forEach(ensureArray(xml['iscsi-target'].LUN), lun => {
    luns.push({
      id: lun.LUNid.trim(),
      vendor: lun.vendor.trim(),
      serial: lun.serial.trim(),
      size: lun.size.trim(),
      scsiId: lun.SCSIid.trim()
    })
  })

  return luns
}

probeIscsiLuns.params = {
  host: { type: 'string' },
  target: { type: 'string' },
  port: { type: 'integer', optional: true },
  targetIqn: { type: 'string' },
  chapUser: { type: 'string', optional: true },
  chapPassword: { type: 'string', optional: true }
}

probeIscsiLuns.resolve = {
  host: ['host', 'host', 'administrate']
}

// -------------------------------------------------------------------
// This function helps to detect if this target already exists in XAPI
// It returns a table of SR UUID, empty if no existing connections

export async function probeIscsiExists ({
  host,
  target: targetIp,
  port,
  targetIqn,
  scsiId,
  chapUser,
  chapPassword
}) {
  const xapi = this.getXapi(host)

  const deviceConfig = {
    target: targetIp,
    targetIQN: targetIqn,
    SCSIid: scsiId
  }

  // if we give user and password
  if (chapUser && chapPassword) {
    deviceConfig.chapUser = chapUser
    deviceConfig.chapPassword = chapPassword
  }

  //  if we give another port than default iSCSI
  if (port) {
    deviceConfig.port = port
  }

  const xml = parseXml(await xapi.call('SR.probe', host._xapiRef, deviceConfig, 'lvmoiscsi', {}))

  const srs = []
  forEach(ensureArray(xml['SRlist'].SR), sr => {
    // get the UUID of SR connected to this LUN
    srs.push({uuid: sr.UUID.trim()})
  })

  return srs
}

probeIscsiExists.params = {
  host: { type: 'string' },
  target: { type: 'string' },
  port: { type: 'integer', optional: true },
  targetIqn: { type: 'string' },
  scsiId: { type: 'string' },
  chapUser: { type: 'string', optional: true },
  chapPassword: { type: 'string', optional: true }
}

probeIscsiExists.resolve = {
  host: ['host', 'host', 'administrate']
}

// -------------------------------------------------------------------
// This function helps to detect if this NFS SR already exists in XAPI
// It returns a table of SR UUID, empty if no existing connections

export async function probeNfsExists ({
  host,
  server,
  serverPath
}) {
  const xapi = this.getXapi(host)

  const deviceConfig = {
    server,
    serverpath: serverPath
  }

  const xml = parseXml(await xapi.call('SR.probe', host._xapiRef, deviceConfig, 'nfs', {}))

  const srs = []

  forEach(ensureArray(xml['SRlist'].SR), sr => {
    // get the UUID of SR connected to this LUN
    srs.push({uuid: sr.UUID.trim()})
  })

  return srs
}

probeNfsExists.params = {
  host: { type: 'string' },
  server: { type: 'string' },
  serverPath: { type: 'string' }
}

probeNfsExists.resolve = {
  host: ['host', 'host', 'administrate']
}

// -------------------------------------------------------------------
// This function helps to reattach a forgotten NFS/iSCSI SR

export async function reattach ({
  host,
  uuid,
  nameLabel,
  nameDescription,
  type
}) {
  const xapi = this.getXapi(host)

  if (type === 'iscsi') {
    type = 'lvmoiscsi' // the internal XAPI name
  }

  const srRef = await xapi.call(
    'SR.introduce',
    uuid,
    nameLabel,
    nameDescription,
    type,
    'user',
    true,
    {}
  )

  const sr = await xapi.call('SR.get_record', srRef)
  return sr.uuid
}

reattach.params = {
  host: { type: 'string' },
  uuid: { type: 'string' },
  nameLabel: { type: 'string' },
  nameDescription: { type: 'string' },
  type: { type: 'string' }
}

reattach.resolve = {
  host: ['host', 'host', 'administrate']
}

// -------------------------------------------------------------------
// This function helps to reattach a forgotten ISO SR

export async function reattachIso ({
  host,
  uuid,
  nameLabel,
  nameDescription,
  type
}) {
  const xapi = this.getXapi(host)

  if (type === 'iscsi') {
    type = 'lvmoiscsi' // the internal XAPI name
  }

  const srRef = await xapi.call(
    'SR.introduce',
    uuid,
    nameLabel,
    nameDescription,
    type,
    'iso',
    true,
    {}
  )

  const sr = await xapi.call('SR.get_record', srRef)
  return sr.uuid
}

reattachIso.params = {
  host: { type: 'string' },
  uuid: { type: 'string' },
  nameLabel: { type: 'string' },
  nameDescription: { type: 'string' },
  type: { type: 'string' }
}

reattachIso.resolve = {
  host: ['host', 'host', 'administrate']
}
