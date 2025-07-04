import { HOST_POWER_STATE, VM_POWER_STATE, XoHost, XoSr, XoVm, type XoPool } from '@vates/types'
import type { RestApi } from '../rest-api/rest-api.mjs'
import { HostService } from '../hosts/host.service.mjs'
import { VmService } from '../vms/vm.service.mjs'
import { AlarmService } from '../alarms/alarm.service.mjs'
import { getTopPerProperty, isSrWritable } from '../helpers/utils.helper.mjs'

export class PoolService {
  #restApi: RestApi
  #hostService: HostService
  #vmService: VmService
  #alarmService: AlarmService

  constructor(restApi: RestApi) {
    this.#restApi = restApi
    this.#hostService = this.#restApi.ioc.get(HostService)
    this.#vmService = this.#restApi.ioc.get(VmService)
    this.#alarmService = this.#restApi.ioc.get(AlarmService)
  }

  #getHostsStatus(poolId: XoPool['id']) {
    const { running, disabled, halted, total } = this.#hostService.getHostsStatus({
      filter: host => host.$pool === poolId,
    })

    return { running, disabled, halted, total }
  }

  #getVmsStatus(poolId: XoPool['id']) {
    const { running, halted, paused, total, suspended } = this.#vmService.getVmsStatus({
      filter: vm => vm.$pool === poolId,
    })

    return {
      running,
      halted,
      paused,
      total,
      suspended,
    }
  }

  #getAlarms(poolId: XoPool['id']) {
    const alarms = this.#alarmService.getAlarms({ filter: alarm => alarm.$pool === poolId })
    return Object.values(alarms)
  }

  async #getMissingPatches(poolId: XoPool['id']) {
    const missingPatchesInfo = await this.#hostService.getMissingPatchesInfo({ filter: host => host.$pool === poolId })
    if (!missingPatchesInfo.hasAuthorization) {
      return {
        hasAuthorization: false,
      }
    }

    const { hasAuthorization, missingPatches } = missingPatchesInfo
    return {
      hasAuthorization,
      missingPatches,
    }
  }

  #getTopFiveSrsUsage(poolId: XoPool['id']) {
    const srs = Object.values(
      this.#restApi.getObjectsByType<XoSr>('SR', {
        filter: sr => sr.$pool === poolId && isSrWritable(sr),
      })
    )

    const topFive = getTopPerProperty(
      srs.map(({ name_label, id, physical_usage, size }) => ({
        name_label,
        id,
        percent: (physical_usage / size) * 100,
        physical_usage,
        size,
      })),
      { prop: 'percent', length: 5 }
    )

    return topFive
  }

  #getTopFiveHostsRamUsage(poolId: XoPool['id']) {
    const hosts = Object.values(
      this.#restApi.getObjectsByType<XoHost>('host', {
        filter: host => host.$pool === poolId && host.power_state === HOST_POWER_STATE.RUNNING,
      })
    )

    const topFive = getTopPerProperty(
      hosts.map(({ name_label, id, memory: { size, usage } }) => ({
        name_label,
        id,
        size,
        usage,
        percent: (usage / size) * 100,
      })),
      { length: 5, prop: 'percent' }
    )

    return topFive
  }

  async #getTopFiveVmsRamUsage(poolId: XoPool['id']) {
    const vms = this.#restApi.getObjectsByType<XoVm>('VM', {
      filter: vm =>
        vm.$pool === poolId &&
        vm.managementAgentDetected === true &&
        (vm.power_state === VM_POWER_STATE.RUNNING || vm.power_state === VM_POWER_STATE.PAUSED),
    })

    const vmsWithPercent: (Pick<XoVm, 'id' | 'name_label'> & {
      percent: number
      memory: number
      memoryFree: number
    })[] = []
    for (const id in vms) {
      const vm = vms[id as XoVm['id']]
      const stats = await this.#restApi.xoApp.getXapiVmStats(vm.id, 'seconds')
      const memory = stats.stats.memory?.pop() ?? 0
      const memoryFree = stats.stats.memoryFree?.pop() ?? 0
      const usage = memory - memoryFree

      vmsWithPercent.push({ id: vm.id, name_label: vm.name_label, memory, memoryFree, percent: (usage / memory) * 100 })
    }

    const topFive = getTopPerProperty(vmsWithPercent, { prop: 'percent', length: 5 })
    return topFive
  }

  async #getTopFiveHostsCpuUsage(poolId: XoPool['id']) {
    const hosts = this.#restApi.getObjectsByType<XoHost>('host', {
      filter: host => host.$pool === poolId && host.power_state === HOST_POWER_STATE.RUNNING,
    })

    const hostsWithPercent: (Pick<XoHost, 'id' | 'name_label'> & { percent: number })[] = []
    for (const id in hosts) {
      const host = hosts[id as XoHost['id']]
      const stats = await this.#restApi.xoApp.getXapiHostStats(host.id, 'seconds')
      const cpus = Object.values(stats.stats.cpus ?? {})
      const percent =
        cpus.reduce((total, cpus) => {
          total += cpus.pop() ?? 0
          return total
        }, 0) / cpus.length

      hostsWithPercent.push({ percent, id: host.id, name_label: host.name_label })
    }

    const topFive = getTopPerProperty(hostsWithPercent, { prop: 'percent', length: 5 })
    return topFive
  }

  async #getTopFiveVmsCpuUsage(poolId: XoPool['id']) {
    const vms = this.#restApi.getObjectsByType<XoVm>('VM', {
      filter: vm =>
        vm.$pool === poolId && (vm.power_state === VM_POWER_STATE.RUNNING || vm.power_state === VM_POWER_STATE.PAUSED),
    })

    const vmsWithPercent: (Pick<XoVm, 'id' | 'name_label'> & {
      percent: number
    })[] = []
    for (const id in vms) {
      const vm = vms[id as XoVm['id']]
      const stats = await this.#restApi.xoApp.getXapiVmStats(vm.id, 'seconds')
      const cpus = Object.values(stats.stats.cpus ?? {})
      const percent = cpus.reduce((total, cpus) => {
        total += cpus.pop() ?? 0
        return total
      }, 0)

      vmsWithPercent.push({ id: vm.id, name_label: vm.name_label, percent })
    }

    const topFive = getTopPerProperty(vmsWithPercent, { prop: 'percent', length: 5 })
    return topFive
  }

  #getCpuProvisioning(poolId: XoPool['id']) {
    const pool = this.#restApi.getObject<XoPool>(poolId, 'pool')

    const vms = this.#restApi.getObjectsByType<XoVm>('VM', {
      filter: vm =>
        vm.$pool === poolId && (vm.power_state === VM_POWER_STATE.RUNNING || vm.power_state === VM_POWER_STATE.PAUSED),
    })

    let assignedVcpu = 0
    for (const id in vms) {
      const vm = vms[id as XoVm['id']]
      assignedVcpu += vm.CPUs.number
    }

    const total = pool.cpus.cores ?? 0

    return {
      total: pool.cpus.cores,
      assigned: assignedVcpu,
      percent: (assignedVcpu * 100) / total,
    }
  }

  async getDashboard(id: XoPool['id']) {
    const hostStatus = this.#getHostsStatus(id)
    const vmsStatus = this.#getVmsStatus(id)
    const alarms = this.#getAlarms(id)
    const missingPatches = await this.#getMissingPatches(id)
    const storageUsage = this.#getTopFiveSrsUsage(id)
    const hostsRamUsage = this.#getTopFiveHostsRamUsage(id)
    const vmsRamUsage = await this.#getTopFiveVmsRamUsage(id)
    const hostsCpuUsage = await this.#getTopFiveHostsCpuUsage(id)
    const vmsCpuUsage = await this.#getTopFiveVmsCpuUsage(id)
    const cpuProvisioning = this.#getCpuProvisioning(id)

    return {
      hostStatus,
      vmsStatus,
      alarms,
      missingPatches,
      storageUsage,
      ramUsage: {
        hosts: hostsRamUsage,
        vms: vmsRamUsage,
      },
      cpuUsage: {
        hosts: hostsCpuUsage,
        vms: vmsCpuUsage,
      },
      cpuProvisioning,
    }
  }
}
