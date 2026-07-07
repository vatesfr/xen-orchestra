import type { Xapi, XenApiSr, XoHost, XoSr } from '@vates/types'
import type { RestApi } from '../rest-api/rest-api.mjs'
import { ApiError } from '../helpers/error.helper.mjs'
import { LicenseService } from '../licenses/license.service.mjs'
import { forEach, parseXml } from '../../../../packages/xo-server/src/utils.mjs'
import ensureArray from '../../../../packages/xo-server/src/_ensureArray.mjs'

type NfsExport = {
  path: string
  acl: string
}

type HbaExport = {
  hba: string
  id: string
  lun: number
  path: string
  scsiId: string
  serial: string
  size: number
  vendor: string
}

type IscsiLunsExport = {
  id: string
  vendor: string
  serial: string
  size: string
  scsiId: string
}

type IscsiIqnsExport = {
  iqn: string
  ip: string
}

type Srs = {
  uuid: string
}

// Derived from `xapi.SR_create` params, renamed to stay consistent with the XO SR
// representation returned by `GET /srs/:id`: `hostId` (XO id, not XAPI ref),
// `SR_type` and `size` instead of XAPI's `type`/`physical_size`.
// `device_config` is passed through as-is, `shared` is computed from `SR_type`.
export type CreateSrBody = Omit<Parameters<Xapi['SR_create']>[0], 'host' | 'type' | 'physical_size' | 'shared'> & {
  hostId: string
  SR_type: XoSr['SR_type']
  size?: number
}

// SR types backed by network/SAN storage, every other type is local to the host
const SHARED_SR_TYPES: ReadonlySet<XoSr['SR_type']> = new Set([
  'cephfs',
  'glusterfs',
  'hba',
  'lvmofcoe',
  'lvmohba',
  'lvmoiscsi',
  'moosefs',
  'nfs',
  'smb',
])

export class SrService {
  #restApi: RestApi

  constructor(restApi: RestApi) {
    this.#restApi = restApi
  }

  async create(body: CreateSrBody): Promise<XoSr['id']> {
    const { hostId, SR_type, size, ...rest } = body
    if (SR_type === 'linstor') {
      // XOSTOR creation requires dedicated logic (licenses, multi-host setup), not supported yet
      throw new ApiError('SR creation with SR_type "linstor" (XOSTOR) is not implemented yet', 501)
    }
    const xapiHost = this.#restApi.getXapiObject<XoHost>(hostId as XoHost['id'], 'host')
    const ref = await xapiHost.$xapi.SR_create({
      ...rest,
      // XAPI expects ISO libraries to have an `iso` content type
      ...(SR_type === 'iso' && { content_type: 'iso' as const }),
      host: xapiHost.$ref,
      physical_size: size,
      // an ISO SR is local only when it targets a local path (`legacy_mode`), same rules as xo-server `sr.createIso`
      shared: SR_type === 'iso' ? rest.device_config.legacy_mode !== 'true' : SHARED_SR_TYPES.has(SR_type),
      type: SR_type,
    })
    return (await xapiHost.$xapi.getField<XenApiSr, 'uuid'>('SR', ref, 'uuid')) as XoSr['id']
  }

  async delete(id: XoSr['id']): Promise<void> {
    const sr = this.#restApi.getObject<XoSr>(id, 'SR')
    const xapiSr = this.#restApi.getXapiObject<XoSr>(id, 'SR')
    const xapi = xapiSr.$xapi

    if (sr.SR_type === 'linstor') {
      const licenseService = this.#restApi.ioc.get(LicenseService)
      const licenses = await licenseService.getXostorLicenses(id)
      await Promise.all(
        licenses.map(({ licenseId, boundObjectId }) =>
          this.#restApi.xoApp.unbindLicense({ licenseId, boundObjectId, productId: 'xostor' })
        )
      )
      try {
        await xapi.xostor_delete(xapiSr.$ref)
      } catch (error) {
        await Promise.all(
          licenses.map(({ licenseId, boundObjectId }) => this.#restApi.xoApp.bindLicense({ licenseId, boundObjectId }))
        )
        throw error
      }
    } else {
      await xapi.destroySr(id)
    }
  }

  async probeNfs(id: XoHost['id'], server: string, nfsVersion?: string): Promise<NfsExport[]> {
    // const host = this.#restApi.getObject<XoHost>(id, 'host')
    const xapiHost = this.#restApi.getXapiObject<XoHost>(id, 'host')
    const xapi = xapiHost.$xapi

    let xml: ReturnType<typeof parseXml>
    const deviceConfig = {
      nfsversion: nfsVersion,
      server,
    }

    try {
      await xapi.call('SR.probe', xapiHost.$ref, deviceConfig, 'nfs', {})

      throw new Error('the call above should have thrown an error')
    } catch (error: any) {
      if (error.code !== 'SR_BACKEND_FAILURE_101') {
        throw error
      }

      xml = parseXml(error.params[2])
    }

    const nfsExports: NfsExport[] = []
    forEach(ensureArray(xml['nfs-exports'].Export), nfsExport => {
      nfsExports.push({
        // NFSv4 doesn't return the full path, and we need to add a slash at the beginning of it, or SR creation with this path will fail
        path: nfsExport.Path.trim().replace(/^\/?/, '/'),
        acl: nfsExport.Accesslist.trim(),
      })
    })

    return nfsExports
  }

  async probeZfs(id: XoHost['id']) {
    const xapiHost = this.#restApi.getXapiObject<XoHost>(id, 'host')
    const xapi = xapiHost.$xapi
    try {
      const result = (await xapi.call('host.call_plugin', xapiHost.$ref, 'zfs.py', 'list_zfs_pools', {})) as string
      console.log(result)
      return JSON.parse(result)
    } catch (error: any) {
      if (error.code === 'XENAPI_MISSING_PLUGIN' || error.code === 'UNKNOWN_XENAPI_PLUGIN_FUNCTION') {
        return {}
      } else {
        throw error
      }
    }
  }

  async probeHba(id: XoHost['id']): Promise<HbaExport[]> {
    const xapiHost = this.#restApi.getXapiObject<XoHost>(id, 'host')
    const xapi = xapiHost.$xapi

    let xml: ReturnType<typeof parseXml>

    try {
      await xapi.call('SR.probe', xapiHost.$ref, {}, 'lvmohba', {})

      throw new Error('the call above should have thrown an error')
    } catch (error: any) {
      if (error.code !== 'SR_BACKEND_FAILURE_107') {
        throw error
      }

      xml = parseXml(error.params[2])
    }

    const hbaDevices: HbaExport[] = []
    forEach(ensureArray(xml.Devlist.BlockDevice), hbaDevice => {
      hbaDevices.push({
        hba: hbaDevice.hba.trim(),
        id: hbaDevice.id.trim(),
        lun: +hbaDevice.lun.trim(),
        path: hbaDevice.path.trim(),
        scsiId: hbaDevice.SCSIid.trim(),
        serial: hbaDevice.serial.trim(),
        size: +hbaDevice.size.trim(),
        vendor: hbaDevice.vendor.trim(),
      })
    })

    return hbaDevices
  }

  async probeIscsiIqns(
    id: XoHost['id'],
    targetIp: string,
    port?: number,
    chapUser?: string,
    chapPassword?: string
  ): Promise<IscsiIqnsExport[]> {
    const xapiHost = this.#restApi.getXapiObject<XoHost>(id, 'host')
    const xapi = xapiHost.$xapi

    type DeviceConfig = {
      target: string
      chapuser?: string
      chappassword?: string
      port?: number
    }

    const deviceConfig: DeviceConfig = {
      target: targetIp,
    }

    // if we give user and password
    if (chapUser && chapPassword) {
      deviceConfig.chapuser = chapUser
      deviceConfig.chappassword = chapPassword
    }

    //  if we give another port than default iSCSI
    if (port) {
      deviceConfig.port = port as number
    }

    let xml: ReturnType<typeof parseXml>

    try {
      await xapi.call('SR.probe', xapiHost.$ref, deviceConfig, 'lvmoiscsi', {})

      throw new Error('the call above should have thrown an error')
    } catch (error: any) {
      if (error.code === 'SR_BACKEND_FAILURE_141') {
        return []
      }
      if (error.code !== 'SR_BACKEND_FAILURE_96') {
        throw error
      }

      xml = parseXml(error.params[2])
    }

    const targets: IscsiIqnsExport[] = []
    forEach(ensureArray(xml['iscsi-target-iqns'].TGT), target => {
      // if the target is on another IP address, do not display it
      if (target.IPAddress.trim() === targetIp) {
        targets.push({
          iqn: target.TargetIQN.trim(),
          ip: target.IPAddress.trim(),
        })
      }
    })

    return targets
  }

  async probeIscsiLuns(
    id: XoHost['id'],
    targetIp: string,
    targetIqn: string,
    port?: number,
    chapUser?: string,
    chapPassword?: string
  ): Promise<IscsiLunsExport[]> {
    const xapiHost = this.#restApi.getXapiObject<XoHost>(id, 'host')
    const xapi = xapiHost.$xapi

    type DeviceConfig = {
      target: string
      targetIQN: string
      chapuser?: string
      chappassword?: string
      port?: number
    }

    const deviceConfig: DeviceConfig = {
      target: targetIp,
      targetIQN: targetIqn,
    }

    // if we give user and password
    if (chapUser && chapPassword) {
      deviceConfig.chapuser = chapUser
      deviceConfig.chappassword = chapPassword
    }

    //  if we give another port than default iSCSI
    if (port) {
      deviceConfig.port = port as number
    }

    let xml: ReturnType<typeof parseXml>

    try {
      await xapi.call('SR.probe', xapiHost.$ref, deviceConfig, 'lvmoiscsi', {})

      throw new Error('the call above should have thrown an error')
    } catch (error: any) {
      if (error.code !== 'SR_BACKEND_FAILURE_107') {
        throw error
      }

      xml = parseXml(error.params[2])
    }

    const luns: IscsiLunsExport[] = []
    forEach(ensureArray(xml['iscsi-target'].LUN), lun => {
      luns.push({
        id: lun.LUNid.trim(),
        vendor: lun.vendor.trim(),
        serial: lun.serial?.trim() || '',
        size: lun.size?.trim(),
        scsiId: lun.SCSIid.trim(),
      })
    })

    return luns
  }

  async probeIscsiExists(
    id: XoHost['id'],
    targetIp: string,
    targetIqn: string,
    scsiId: string,
    port?: number,
    chapUser?: string,
    chapPassword?: string
  ): Promise<Srs[]> {
    const xapiHost = this.#restApi.getXapiObject<XoHost>(id, 'host')
    const xapi = xapiHost.$xapi

    type DeviceConfig = {
      target: string
      targetIQN: string
      SCSIid: string
      port?: number
      chapuser?: string
      chappassword?: string
    }

    const deviceConfig: DeviceConfig = {
      target: targetIp,
      targetIQN: targetIqn,
      SCSIid: scsiId,
    }

    // if we give user and password
    if (chapUser && chapPassword) {
      deviceConfig.chapuser = chapUser
      deviceConfig.chappassword = chapPassword
    }

    //  if we give another port than default iSCSI
    if (port) {
      deviceConfig.port = port as number
    }

    const xml = parseXml(await xapi.call('SR.probe', xapiHost.$ref, deviceConfig, 'lvmoiscsi', {}))

    const srs: Srs[] = []
    forEach(ensureArray(xml.SRlist.SR), sr => {
      // get the UUID of SR connected to this LUN
      srs.push({ uuid: sr.UUID.trim() })
    })

    return srs
  }

  async probeHbaExists(id: XoHost['id'], scsiId: string): Promise<Srs[]> {
    const xapiHost = this.#restApi.getXapiObject<XoHost>(id, 'host')
    const xapi = xapiHost.$xapi

    const deviceConfig = {
      SCSIid: scsiId,
    }

    const xml = parseXml(await xapi.call('SR.probe', xapiHost.$ref, deviceConfig, 'lvmohba', {}))

    const srs: Srs[] = []
    forEach(ensureArray(xml.SRlist.SR), sr => {
      // get the UUID of SR connected to this LUN
      srs.push({ uuid: sr.UUID.trim() })
    })

    return srs
  }

  async probeNfsExists(id: XoHost['id'], server: string, serverPath: string, nfsVersion?: string): Promise<Srs[]> {
    const xapiHost = this.#restApi.getXapiObject<XoHost>(id, 'host')
    const xapi = xapiHost.$xapi

    const deviceConfig = {
      nfsversion: nfsVersion,
      server,
      serverpath: serverPath,
    }

    const xml = parseXml(await xapi.call('SR.probe', xapiHost.$ref, deviceConfig, 'nfs', {}))

    const srs: Srs[] = []

    forEach(ensureArray(xml.SRlist.SR), sr => {
      // get the UUID of SR connected to this LUN
      srs.push({ uuid: sr.UUID.trim() })
    })

    return srs
  }
}
