import type { VmwareVm, XoNetwork, XoSr, XoVmTemplate } from '@vates/types'

import type { V2vStartBody, V2vStartVm } from './v2v.type.mjs'

/** what the import of one VM will be given */
export type V2vVmPlan = {
  id: string
  name: string
  sr: XoSr['id']
  network: XoNetwork['id']
  template: XoVmTemplate['id']
  stopSource: boolean
}

export type V2vProblem = { vm?: string; field?: string; message: string }

/**
 * The distinct values the devices of a VM are mapped to, the default one for a device without override.
 *
 * The import only supports one SR and one network per VM for now.
 */
function resolveDeviceMapping(
  keys: readonly string[],
  overrides: Readonly<Record<string, string>> | undefined,
  defaultValue: string
): string[] {
  const values = new Set(keys.map(key => overrides?.[key] ?? defaultValue))
  // a VM without any disk or card still needs a value
  return values.size === 0 ? [defaultValue] : [...values]
}

/**
 * Checks a launch against the source and what the import supports, before anything is started.
 *
 * As in XO5, the XCP-ng side is not checked: neither the pool of the SRs, networks and templates, nor
 * the imports already running, nor the existing imports. The UI only offers valid choices, and the
 * import resumes a partial import by itself, or imports the VM again.
 *
 * Every problem is reported at once, so that a list can be fixed in one go.
 */
export function planMigration(
  body: Readonly<V2vStartBody>,
  /** VMs of the source, by id */
  sourceVms: ReadonlyMap<string, VmwareVm>
): { plans: V2vVmPlan[]; problems: V2vProblem[] } {
  const { defaults } = body
  const problems: V2vProblem[] = []
  const plans: V2vVmPlan[] = []

  if (defaults.startVm === true) {
    problems.push({ field: 'defaults.startVm', message: 'starting the VM after its import is not supported yet' })
  }
  if (defaults.cleanup === true) {
    problems.push({ field: 'defaults.cleanup', message: 'cleaning up the VM is not supported yet' })
  }

  const seen = new Set<string>()
  for (const vm of body.vms) {
    const problemCount = problems.length
    const plan = planVm(vm)
    if (plan !== undefined && problems.length === problemCount) {
      plans.push(plan)
    }
  }
  return { plans, problems }

  function planVm(vm: Readonly<V2vStartVm>): V2vVmPlan | undefined {
    const { id } = vm
    const report = (message: string, field?: string) => problems.push({ vm: id, field, message })

    if (seen.has(id)) {
      report('the VM is listed more than once')
      return
    }
    seen.add(id)

    const sourceVm = sourceVms.get(id)
    if (sourceVm === undefined) {
      report('no such VM on the source')
      return
    }

    // options the import cannot honour yet: refused rather than silently ignored
    if (vm.startVm === true) {
      report('starting the VM after its import is not supported yet', 'startVm')
    }
    if (vm.cleanup === true) {
      report('cleaning up the VM is not supported yet', 'cleanup')
    }
    if (vm.tags !== undefined && vm.tags.length > 0) {
      report('setting tags is not supported yet', 'tags')
    }
    if (vm.keepMac === false) {
      report('the MAC addresses are always kept for now', 'keepMac')
    }

    for (const disk of sourceVm.disks) {
      if (disk.rdm) {
        report(`the disk ${disk.key} is a raw device mapping, which cannot be imported`, 'disks')
      }
      if (disk.encrypted) {
        report(`the disk ${disk.key} is encrypted, which cannot be imported`, 'disks')
      }
    }

    const diskKeys = sourceVm.disks.map(disk => disk.key)
    const nicKeys = sourceVm.nics.map(nic => nic.key)
    for (const key of Object.keys(vm.disks ?? {})) {
      if (!diskKeys.includes(key)) {
        report(`no disk ${key} on the VM`, 'disks')
      }
    }
    for (const key of Object.keys(vm.nics ?? {})) {
      if (!nicKeys.includes(key)) {
        report(`no network card ${key} on the VM`, 'nics')
      }
    }

    const srs = resolveDeviceMapping(diskKeys, vm.disks, defaults.sr)
    const networks = resolveDeviceMapping(nicKeys, vm.nics, defaults.network)
    if (srs.length > 1) {
      report('the disks of a VM must all go to the same SR for now', 'disks')
    }
    if (networks.length > 1) {
      report('the network cards of a VM must all go to the same network for now', 'nics')
    }
    const [sr] = srs
    const [network] = networks
    const template = vm.template ?? defaults.template

    return {
      id,
      name: sourceVm.name ?? id,
      sr: sr as XoSr['id'],
      network: network as XoNetwork['id'],
      template: template as XoVmTemplate['id'],
      stopSource: vm.stopSource ?? defaults.stopSource ?? false,
    }
  }
}
