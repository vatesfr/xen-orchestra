import endsWith from 'lodash/endsWith'
import JSON5 from 'json5'
import { BaseError } from 'make-error'

import { parseDateTime } from './xapi'

const RRD_STEP_SECONDS = 5
const RRD_STEP_MINUTES = 60
const RRD_STEP_HOURS = 3600
const RRD_STEP_DAYS = 86400

const RRD_STEP_FROM_STRING = {
  'seconds': RRD_STEP_SECONDS,
  'minutes': RRD_STEP_MINUTES,
  'hours': RRD_STEP_HOURS,
  'days': RRD_STEP_DAYS
}

const RRD_POINTS_PER_STEP = {
  [RRD_STEP_SECONDS]: 120,
  [RRD_STEP_MINUTES]: 120,
  [RRD_STEP_HOURS]: 168,
  [RRD_STEP_DAYS]: 366
}

export class XapiStatsError extends BaseError {}

export class UnknownLegendFormat extends XapiStatsError {
  constructor (line) {
    super('Unknown legend line: ' + line)
  }
}

export class FaultyGranularity extends XapiStatsError {}

// -------------------------------------------------------------------
// Utils
// -------------------------------------------------------------------

// Return current local timestamp in seconds
function getCurrentTimestamp () {
  return Date.now() / 1000
}

function convertNanToNull (value) {
  return isNaN(value) ? null : value
}

async function getServerTimestamp (xapi, host) {
  const serverLocalTime = await xapi.call('host.get_servertime', host.$ref)
  return Math.floor(parseDateTime(serverLocalTime).getTime() / 1000)
}

// -------------------------------------------------------------------
// Stats
// -------------------------------------------------------------------

function getNewHostStats () {
  return {
    cpus: [],
    pifs: {
      rx: [],
      tx: []
    },
    load: [],
    memory: [],
    memoryFree: [],
    memoryUsed: []
  }
}

function getNewVmStats () {
  return {
    cpus: [],
    vifs: {
      rx: [],
      tx: []
    },
    xvds: {
      r: {},
      w: {}
    },
    memory: [],
    memoryFree: [],
    memoryUsed: []
  }
}

// -------------------------------------------------------------------
// Stats legends
// -------------------------------------------------------------------

function getNewHostLegends () {
  return {
    cpus: [],
    pifs: {
      rx: [],
      tx: []
    },
    load: null,
    memoryFree: null,
    memory: null
  }
}

function getNewVmLegends () {
  return {
    cpus: [],
    vifs: {
      rx: [],
      tx: []
    },
    xvds: {
      r: [],
      w: []
    },
    memoryFree: null,
    memory: null
  }
}

// Compute one legend line for one host
function parseOneHostLegend (hostLegend, type, index) {
  let resReg

  if ((resReg = /^cpu([0-9]+)$/.exec(type)) !== null) {
    hostLegend.cpus[resReg[1]] = index
  } else if ((resReg = /^pif_eth([0-9]+)_(rx|tx)$/.exec(type)) !== null) {
    if (resReg[2] === 'rx') {
      hostLegend.pifs.rx[resReg[1]] = index
    } else {
      hostLegend.pifs.tx[resReg[1]] = index
    }
  } else if (type === 'loadavg') {
    hostLegend.load = index
  } else if (type === 'memory_free_kib') {
    hostLegend.memoryFree = index
  } else if (type === 'memory_total_kib') {
    hostLegend.memory = index
  }
}

// Compute one legend line for one vm
function parseOneVmLegend (vmLegend, type, index) {
  let resReg

  if ((resReg = /^cpu([0-9]+)$/.exec(type)) !== null) {
    vmLegend.cpus[resReg[1]] = index
  } else if ((resReg = /^vif_([0-9]+)_(rx|tx)$/.exec(type)) !== null) {
    if (resReg[2] === 'rx') {
      vmLegend.vifs.rx[resReg[1]] = index
    } else {
      vmLegend.vifs.tx[resReg[1]] = index
    }
  } else if ((resReg = /^vbd_xvd(.)_(read|write)$/.exec(type))) {
    if (resReg[2] === 'read') {
      vmLegend.xvds.r[resReg[1]] = index
    } else {
      vmLegend.xvds.w[resReg[1]] = index
    }
  } else if (type === 'memory_internal_free') {
    vmLegend.memoryFree = index
  } else if (endsWith(type, 'memory')) {
    vmLegend.memory = index
  }
}

// Compute Stats Legends for host and vms from RRD update
function parseLegends (json) {
  const hostLegends = getNewHostLegends()
  const vmsLegends = {}

  json.meta.legend.forEach((value, index) => {
    const parsedLine = /^AVERAGE:(host|vm):(.+):(.+)$/.exec(value)

    if (parsedLine === null) {
      throw new UnknownLegendFormat(value)
    }

    const [ , name, uuid, type, , ] = parsedLine

    if (name !== 'vm') {
      parseOneHostLegend(hostLegends, type, index)
    } else {
      if (vmsLegends[uuid] === undefined) {
        vmsLegends[uuid] = getNewVmLegends()
      }

      parseOneVmLegend(vmsLegends[uuid], type, index)
    }
  })

  return [hostLegends, vmsLegends]
}

export default class XapiStats {
  constructor () {
    this._vms = {}
    this._hosts = {}
  }

  // -------------------------------------------------------------------
  // Remove stats (Helper)
  // -------------------------------------------------------------------

  _removeOlderStats (source, dest, pointsPerStep) {
    for (const key in source) {
      if (key === 'cpus') {
        for (const cpuIndex in source.cpus) {
          dest.cpus[cpuIndex].splice(0, dest.cpus[cpuIndex].length - pointsPerStep)
        }

        // If the number of cpus has been decreased, remove !
        let offset

        if ((offset = dest.cpus.length - source.cpus.length) > 0) {
          dest.cpus.splice(-offset)
        }
      } else if (endsWith(key, 'ifs')) {
        // For each pif or vif
        for (const ifType in source[key]) {
          for (const pifIndex in source[key][ifType]) {
            dest[key][ifType][pifIndex].splice(0, dest[key][ifType][pifIndex].length - pointsPerStep)
          }

          // If the number of pifs has been decreased, remove !
          let offset

          if ((offset = dest[key][ifType].length - source[key][ifType].length) > 0) {
            dest[key][ifType].splice(-offset)
          }
        }
      } else if (key === 'xvds') {
        for (const xvdType in source.xvds) {
          for (const xvdLetter in source.xvds[xvdType]) {
            dest.xvds[xvdType][xvdLetter].splice(0, dest.xvds[xvdType][xvdLetter].length - pointsPerStep)
          }

          // If the number of xvds has been decreased, remove !
          // FIXME
        }
      } else if (key === 'load') {
        dest.load.splice(0, dest[key].length - pointsPerStep)
      } else if (key === 'memory') {
        // Load, memory, memoryFree, memoryUsed
        const length = dest.memory.length - pointsPerStep
        dest.memory.splice(0, length)
        dest.memoryFree.splice(0, length)
        dest.memoryUsed.splice(0, length)
      }
    }
  }

  // -------------------------------------------------------------------
  // HOST: Computation and stats update
  // -------------------------------------------------------------------

  // Compute one stats row for one host
  _parseRowHostStats (hostLegends, hostStats, values) {
    // Cpus
    hostLegends.cpus.forEach((cpuIndex, index) => {
      if (hostStats.cpus[index] === undefined) {
        hostStats.cpus[index] = []
      }

      hostStats.cpus[index].push(values[cpuIndex] * 100)
    })

    // Pifs
    for (const pifType in hostLegends.pifs) {
      hostLegends.pifs[pifType].forEach((pifIndex, index) => {
        if (hostStats.pifs[pifType][index] === undefined) {
          hostStats.pifs[pifType][index] = []
        }

        hostStats.pifs[pifType][index].push(convertNanToNull(values[pifIndex]))
      })
    }

    // Load
    hostStats.load.push(convertNanToNull(values[hostLegends.load]))

    // Memory.
    // WARNING! memory/memoryFree are in kB.
    const memory = values[hostLegends.memory] * 1024
    const memoryFree = values[hostLegends.memoryFree] * 1024

    hostStats.memory.push(memory)

    if (hostLegends.memoryFree !== undefined) {
      hostStats.memoryFree.push(memoryFree)
      hostStats.memoryUsed.push(memory - memoryFree)
    }
  }

  // Compute stats for host from RRD update
  _parseHostStats (json, hostname, hostLegends, step) {
    const host = this._hosts[hostname][step]

    if (host.stats === undefined) {
      host.stats = getNewHostStats()
    }

    for (const row of json.data) {
      this._parseRowHostStats(hostLegends, host.stats, row.values)
    }
  }

  // -------------------------------------------------------------------
  // VM: Computation and stats update
  // -------------------------------------------------------------------

  // Compute stats for vms from RRD update
  _parseRowVmStats (vmLegends, vmStats, values) {
    // Cpus
    vmLegends.cpus.forEach((cpuIndex, index) => {
      if (vmStats.cpus[index] === undefined) {
        vmStats.cpus[index] = []
      }

      vmStats.cpus[index].push(values[cpuIndex] * 100)
    })

    // Vifs
    for (const vifType in vmLegends.vifs) {
      vmLegends.vifs[vifType].forEach((vifIndex, index) => {
        if (vmStats.vifs[vifType][index] === undefined) {
          vmStats.vifs[vifType][index] = []
        }

        vmStats.vifs[vifType][index].push(convertNanToNull(values[vifIndex]))
      })
    }

    // Xvds
    for (const xvdType in vmLegends.xvds) {
      for (const index in vmLegends.xvds[xvdType]) {
        if (vmStats.xvds[xvdType][index] === undefined) {
          vmStats.xvds[xvdType][index] = []
        }

        vmStats.xvds[xvdType][index].push(convertNanToNull(values[vmLegends.xvds[xvdType][index]]))
      }
    }

    // Memory
    // WARNING! memoryFree is in Kb not in b, memory is in b
    const memory = values[vmLegends.memory]
    const memoryFree = values[vmLegends.memoryFree] * 1024

    vmStats.memory.push(memory)

    if (vmLegends.memoryFree !== undefined) {
      vmStats.memoryFree.push(memoryFree)
      vmStats.memoryUsed.push(memory - memoryFree)
    }
  }

  // Compute stats for vms
  _parseVmsStats (json, hostname, vmsLegends, step) {
    if (this._vms[hostname][step] === undefined) {
      this._vms[hostname][step] = {}
    }

    const vms = this._vms[hostname][step]

    for (const uuid in vmsLegends) {
      if (vms[uuid] === undefined) {
        vms[uuid] = getNewVmStats()
      }
    }

    for (const row of json.data) {
      for (const uuid in vmsLegends) {
        this._parseRowVmStats(vmsLegends[uuid], vms[uuid], row.values)
      }
    }
  }

  // -------------------------------------------------------------------
  // -------------------------------------------------------------------

  // Execute one http request on a XenServer for get stats
  // Return stats (Json format) or throws got exception
  _getJson (xapi, host, timestamp) {
    return xapi.getResource('/rrd_updates', {
      host,
      query: {
        cf: 'AVERAGE',
        host: 'true',
        json: 'true',
        start: timestamp
      }
    }).then(response => response.readAll().then(JSON5.parse))
  }

  async _getLastTimestamp (xapi, host, step) {
    if (this._hosts[host.address][step] === undefined) {
      const serverTimeStamp = await getServerTimestamp(xapi, host)
      return serverTimeStamp - step * RRD_POINTS_PER_STEP[step] + step
    }

    return this._hosts[host.address][step].endTimestamp
  }

  _getPoints (hostname, step, vmId) {
    const hostStats = this._hosts[hostname][step]

    // Return host points
    if (vmId === undefined) {
      return {
        interval: step,
        ...hostStats
      }
    }

    const vmsStats = this._vms[hostname][step]

    // Return vm points
    return {
      interval: step,
      endTimestamp: hostStats.endTimestamp,
      stats: (vmsStats && vmsStats[vmId]) || getNewVmStats()
    }
  }

  async _getAndUpdatePoints (xapi, host, vmId, granularity) {
    // Get granularity to use
    const step = (granularity === undefined || granularity === 0)
          ? RRD_STEP_SECONDS : RRD_STEP_FROM_STRING[granularity]

    if (step === undefined) {
      throw new FaultyGranularity(`Unknown granularity: '${granularity}'. Use 'seconds', 'minutes', 'hours', or 'days'.`)
    }

    // Limit the number of http requests
    const hostname = host.address

    if (this._hosts[hostname] === undefined) {
      this._hosts[hostname] = {}
      this._vms[hostname] = {}
    }

    if (this._hosts[hostname][step] !== undefined &&
        this._hosts[hostname][step].localTimestamp + step > getCurrentTimestamp()) {
      return this._getPoints(hostname, step, vmId)
    }

    // Check if we are in the good interval, use this._hosts[hostname][step].localTimestamp
    // for avoid bad requests
    // TODO

    // Get json
    const timestamp = await this._getLastTimestamp(xapi, host, step)
    let json = await this._getJson(xapi, host, timestamp)

    // Check if the granularity is linked to 'step'
    // If it's not the case, we retry other url with the json timestamp
    if (json.meta.step !== step) {
      console.log(`RRD call: Expected step: ${step}, received step: ${json.meta.step}. Retry with other timestamp`)
      const serverTimestamp = await getServerTimestamp(xapi, host)

      // Approximately: half points are asked
      // FIXME: Not the best solution
      json = await this._getJson(xapi, host, serverTimestamp - step * (RRD_POINTS_PER_STEP[step] / 2) + step)

      if (json.meta.step !== step) {
        throw new FaultyGranularity(`Unable to get the true granularity: ${json.meta.step}`)
      }
    }

    // Make new backup slot if necessary
    if (this._hosts[hostname][step] === undefined) {
      this._hosts[hostname][step] = {
        endTimestamp: 0,
        localTimestamp: 0
      }
    }

    // It exists data
    if (json.data.length !== 0) {
      // Warning: Sometimes, the json.xport.meta.start value does not match with the
      // timestamp of the oldest data value
      // So, we use the timestamp of the oldest data value !
      const startTimestamp = json.data[json.meta.rows - 1].t

      // Remove useless data and reorder
      // Note: Older values are at end of json.data.row
      const parseOffset = (this._hosts[hostname][step].endTimestamp - startTimestamp + step) / step

      json.data.splice(json.data.length - parseOffset)
      json.data.reverse()

      // It exists useful data
      if (json.data.length > 0) {
        const [hostLegends, vmsLegends] = parseLegends(json)

        // Compute and update host/vms stats
        this._parseVmsStats(json, hostname, vmsLegends, step)
        this._parseHostStats(json, hostname, hostLegends, step)

        // Remove older stats
        this._removeOlderStats(hostLegends, this._hosts[hostname][step].stats, RRD_POINTS_PER_STEP[step])

        for (const uuid in vmsLegends) {
          this._removeOlderStats(vmsLegends[uuid], this._vms[hostname][step][uuid], RRD_POINTS_PER_STEP[step])
        }
      }
    }

    // Update timestamp
    this._hosts[hostname][step].endTimestamp = json.meta.end
    this._hosts[hostname][step].localTimestamp = getCurrentTimestamp()

    return this._getPoints(hostname, step, vmId)
  }

  // -------------------------------------------------------------------
  // -------------------------------------------------------------------

  // Warning: This functions returns one reference on internal data
  // So, data can be changed by a parallel call on this functions
  // It is forbidden to modify the returned data

  // Return host stats
  async getHostPoints (xapi, hostId, granularity) {
    const host = xapi.getObject(hostId)
    return this._getAndUpdatePoints(xapi, host, undefined, granularity)
  }

  // Return vms stats
  async getVmPoints (xapi, vmId, granularity) {
    const vm = xapi.getObject(vmId)
    const host = vm.$resident_on

    if (!host) {
      throw new Error(`VM ${vmId} is halted or host could not be found.`)
    }

    return this._getAndUpdatePoints(xapi, host, vm.uuid, granularity)
  }
}
