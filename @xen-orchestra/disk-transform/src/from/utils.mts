import { type PortableDiskMetadata } from '../PortableDifferencingDisk.mts'

export async function getXapiMetadata(xapi: any, uuid: string): Promise<PortableDiskMetadata> {
  return Promise.resolve({
    id: uuid,
    label: 'vdi',
    description: '',
    virtualSize: 2,
  })
}
export async function getRemoteMetadata(metadata, uuid): Promise<PortableDiskMetadata> {
  return Promise.resolve({
    id: uuid,
    label: 'vdi',
    description: '',
    virtualSize: 2,
  })
}
