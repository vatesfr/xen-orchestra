import type { FrontXoVmTemplate } from '@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'
import type { Vdi, Vif, VmState } from '@/modules/vm/types/new-xo-vm.type.ts'

export function isDiskVmTemplate(template: FrontXoVmTemplate | undefined) {
  return template !== undefined && template.$VBDs.length !== 0 && template.name_label !== 'Other install media'
}

export function getTemplateVmDefaults(template: FrontXoVmTemplate) {
  return {
    name: template.name_label,
    description: template.isDefaultTemplate ? '' : template.name_description,
    ram: template.memory.dynamic[1],
    tags: template.tags,
    vCPU: template.CPUs.number,
    secureBoot: template.secureBoot,
    bootFirmware: template.boot.firmware ?? 'bios',
    highAvailability: template.high_availability as VmState['highAvailability'],
  } satisfies Partial<VmState>
}

export const bytesToGiB = (bytes: number) => Math.floor(bytes / 1024 ** 3)

export const giBToBytes = (giB: number) => giB * 1024 ** 3

export const formatHostname = (hostname: string) => hostname.trim().replace(/\s+/g, '-')

export const generateRandomString = (length: number) =>
  Math.random()
    .toString(36)
    .substring(2, 2 + length)

export function resolveConfigTemplate(pattern: string, name: string, index: number): string {
  const rules: Record<string, string> = {
    '{name}': name,
    '{index}': String(index),
  }
  const matches = Object.keys(rules)
    .map(variable => variable.replace(/[{}]/g, '\\$&'))
    .join('|')
  const variablesRegExp = new RegExp(`\\\\(?:\\\\|${matches})|${matches}`, 'g')

  return pattern.replace(variablesRegExp, match => {
    if (match[0] === '\\') {
      return match.slice(1)
    }

    return rules[match] ?? match
  })
}

export function buildSshCloudConfig(name: string, sshKeys: string[]): string {
  const stringifiedKeys = sshKeys.map(key => `  - ${key}\n`).join('')

  return `#cloud-config
hostname: ${formatHostname(name)}
ssh_authorized_keys:
${stringifiedKeys}`
}

export function getExistingVdisDiff(defaultVdi: Vdi, currentVdi: Vdi, includeSize: boolean) {
  const changes: Record<string, unknown> = {}

  for (const key of Object.keys(defaultVdi) as (keyof Vdi)[]) {
    if (defaultVdi[key] === currentVdi[key] || (key === 'size' && !includeSize)) {
      continue
    }

    changes[key] = currentVdi[key]
  }

  return Object.keys(changes).length > 0 ? (changes as Partial<Vdi>) : undefined
}

export function getExistingVdisChanges(defaultVdis: Vdi[], currentVdis: Vdi[], includeSize: boolean) {
  return defaultVdis.flatMap(defaultVdi => {
    const { id, userdevice } = defaultVdi

    if (userdevice === undefined) {
      return []
    }

    const currentVdi = currentVdis.find(vdi => vdi.id === id)

    return [
      {
        id,
        userdevice,
        isDeleted: currentVdi === undefined,
        changes: currentVdi === undefined ? undefined : getExistingVdisDiff(defaultVdi, currentVdi, includeSize),
      },
    ]
  })
}

export function getExistingVifsDiff(defaultVif: Vif, currentVif: Vif) {
  if (defaultVif.network !== currentVif.network || defaultVif.mac !== currentVif.mac) {
    return {
      network: currentVif.network,
      // change this when API handles empty mac addresses
      mac: currentVif.mac,
    }
  }

  return undefined
}
