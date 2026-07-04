export const ALLOCATION_BY_SR_TYPE = {
  ext: 'thin',
  file: 'thin',
  hba: 'thick',
  iscsi: 'thick',
  lvhd: 'thick',
  lvhdofcoe: 'thick',
  lvhdohba: 'thick',
  lvhdoiscsi: 'thick',
  lvm: 'thick',
  lvmofcoe: 'thick',
  lvmohba: 'thick',
  lvmoiscsi: 'thick',
  nfs: 'thin',
  ocfs: 'thick',
  ocfsohba: 'thick',
  ocfsoiscsi: 'thick',
  rawhba: 'thick',
  rawiscsi: 'thick',
  shm: 'thin',
  smb: 'thin',
  udev: 'thick',
  zfs: 'thin',
} as const

export type SrAllocationStrategy = 'thin' | 'thick' | 'unknown'

export function getAllocationStrategy(srType: string, pbdProvisioning?: string): SrAllocationStrategy | undefined {
  if (srType === 'linstor') {
    return (pbdProvisioning as SrAllocationStrategy) ?? undefined
  }
  return ALLOCATION_BY_SR_TYPE[srType as keyof typeof ALLOCATION_BY_SR_TYPE]
}
