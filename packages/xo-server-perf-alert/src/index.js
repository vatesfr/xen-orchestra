import JSON5 from 'json5'
import { createSchedule } from '@xen-orchestra/cron'
import { createLogger } from '@xen-orchestra/log'
import { filter, forOwn, map, mean } from 'lodash'
import { utcParse } from 'd3-time-format'
import assert from 'node:assert'
const logger = createLogger('xo:xo-server-perf-alert')

const XAPI_TO_XENCENTER = {
  cpuUsage: 'cpu_usage',
  memoryUsage: 'mem_usage',
  storageUsage: 'physical_utilisation',
}

const COMPARATOR_FN = {
  '>': (a, b) => a > b,
  '<': (a, b) => a < b,
}

const VM_FUNCTIONS = {
  cpuUsage: {
    name: 'VM CPU usage',
    description: 'Raises an alarm when the average usage of any CPU is higher/lower than the threshold',
    unit: '%',
    createParser: (comparator, legend, threshold) => {
      const regex = /cpu[0-9]+/
      const filteredLegends = legend.filter(l => l.name.match(regex))
      const accumulator = Object.assign(...filteredLegends.map(l => ({ [l.name]: [] })))
      const getDisplayableValue = () => {
        const means = Object.keys(accumulator).map(l => mean(accumulator[l]))
        return Math.max(...means) * 100
      }
      return {
        parseRow: data => {
          filteredLegends.forEach(l => {
            accumulator[l.name].push(data.values[l.index])
          })
        },
        getDisplayableValue,
        shouldAlarm: () => COMPARATOR_FN[comparator](getDisplayableValue(), threshold),
        threshold,
      }
    },
  },
  memoryUsage: {
    name: 'VM memory usage',
    description: 'Raises an alarm when the used memory % is higher/lower than the threshold',
    unit: '% used',
    createParser: (comparator, legend, threshold) => {
      const memoryBytesLegend = legend.find(l => l.name === 'memory')
      const memoryKBytesFreeLegend = legend.find(l => l.name === 'memory_internal_free')
      const usedMemoryRatio = []
      const getDisplayableValue = () => mean(usedMemoryRatio) * 100
      return {
        parseRow: data => {
          const memory = data.values[memoryBytesLegend.index]
          // some VM don't have this counter
          usedMemoryRatio.push(
            memoryKBytesFreeLegend === undefined
              ? 0
              : (memory - 1024 * data.values[memoryKBytesFreeLegend.index]) / memory
          )
        },
        getDisplayableValue,
        shouldAlarm: () => COMPARATOR_FN[comparator](getDisplayableValue(), threshold),
        threshold,
      }
    },
  },
}

const HOST_FUNCTIONS = {
  cpuUsage: {
    name: 'host CPU usage',
    description: 'Raises an alarm when the average usage of any CPU is higher/lower than the threshold',
    unit: '%',
    createParser: (comparator, legend, threshold) => {
      const regex = /^cpu[0-9]+$/
      const filteredLegends = legend.filter(l => l.name.match(regex))
      const accumulator = Object.assign(...filteredLegends.map(l => ({ [l.name]: [] })))
      const getDisplayableValue = () => {
        const means = Object.keys(accumulator).map(l => mean(accumulator[l]))
        return Math.max(...means) * 100
      }
      return {
        parseRow: data => {
          filteredLegends.forEach(l => {
            accumulator[l.name].push(data.values[l.index])
          })
        },
        getDisplayableValue,
        shouldAlarm: () => COMPARATOR_FN[comparator](getDisplayableValue(), threshold),
        threshold,
      }
    },
  },
  memoryUsage: {
    name: 'host memory usage',
    description: 'Raises an alarm when the used memory % is higher/lower than the threshold',
    unit: '% used',
    createParser: (comparator, legend, threshold) => {
      const memoryKBytesLegend = legend.find(l => l.name === 'memory_total_kib')
      const memoryKBytesFreeLegend = legend.find(l => l.name === 'memory_free_kib')
      const usedMemoryRatio = []
      const getDisplayableValue = () => mean(usedMemoryRatio) * 100
      return {
        parseRow: data => {
          const memory = data.values[memoryKBytesLegend.index]
          usedMemoryRatio.push((memory - data.values[memoryKBytesFreeLegend.index]) / memory)
        },
        getDisplayableValue,
        shouldAlarm: () => COMPARATOR_FN[comparator](getDisplayableValue(), threshold),
        threshold,
      }
    },
  },
}

const SR_FUNCTIONS = {
  storageUsage: {
    name: 'SR storage usage',
    description: 'Raises an alarm when the used disk space % is higher/lower than the threshold',
    unit: '% used',
    createGetter: (comparator, threshold) => sr => {
      const getDisplayableValue = () => (sr.physical_utilisation * 100) / sr.physical_size
      return {
        getDisplayableValue,
        shouldAlarm: () => COMPARATOR_FN[comparator](getDisplayableValue(), threshold),
        threshold,
      }
    },
  },
}

const TYPE_FUNCTION_MAP = {
  vm: VM_FUNCTIONS,
  host: HOST_FUNCTIONS,
  sr: SR_FUNCTIONS,
}

const COMPARATOR_ENTRY = {
  title: 'Comparator',
  type: 'string',
  default: Object.keys(COMPARATOR_FN)[0],
  enum: Object.keys(COMPARATOR_FN),
}

// list of currently ringing alarms, to avoid double notification
const currentAlarms = {}

export const configurationSchema = {
  type: 'object',
  properties: {
    baseUrl: {
      type: 'string',
      title: 'Xen Orchestra URL',
      description: 'URL used in alert messages to quickly get to the VMs (ex: https://xoa.company.tld/ )',
    },
    hostMonitors: {
      type: 'array',
      title: 'Host Monitors',
      description:
        'Alarms checking hosts on all pools. The selected performance counter is sampled regularly and averaged. ' +
        'The Average is compared to the threshold and an alarm is raised upon crossing',
      items: {
        type: 'object',
        properties: {
          smartMode: {
            title: 'All running hosts',
            type: 'boolean',
            description: 'When enabled, all running hosts will be considered for the alert.',
            default: false,
          },
          uuids: {
            title: 'Hosts',
            type: 'array',
            items: {
              type: 'string',
              $type: 'Host',
            },
          },
          variableName: {
            title: 'Alarm Type',
            description: Object.keys(HOST_FUNCTIONS)
              .map(k => `  * ${k} (${HOST_FUNCTIONS[k].unit}): ${HOST_FUNCTIONS[k].description}`)
              .join('\n'),
            type: 'string',
            default: Object.keys(HOST_FUNCTIONS)[0],
            enum: Object.keys(HOST_FUNCTIONS),
          },
          comparator: COMPARATOR_ENTRY,
          alarmTriggerLevel: {
            title: 'Threshold',
            description: 'The direction of the crossing is given by the comparator type',
            type: 'number',
            default: 40,
          },
          alarmTriggerPeriod: {
            title: 'Average Length (s)',
            description:
              'The points are averaged this number of seconds then the average is compared with the threshold',
            type: 'number',
            default: 60,
            enum: [60, 600],
          },
        },
        oneOf: [
          {
            properties: { uuids: {} },
            required: ['uuids'],
          },
          {
            properties: { smartMode: { const: true } },
            required: ['smartMode'],
          },
        ],
      },
    },
    vmMonitors: {
      type: 'array',
      title: 'VM Monitors',
      description:
        'Alarms checking all VMs on all pools. The selected performance counter is sampled regularly and averaged. ' +
        'The Average is compared to the threshold and an alarm is raised upon crossing',
      items: {
        type: 'object',
        properties: {
          smartMode: {
            title: 'All running VMs',
            type: 'boolean',
            description: 'When enabled, all running VMs will be considered for the alert.',
            default: false,
          },
          uuids: {
            title: 'Virtual Machines',
            type: 'array',
            items: {
              type: 'string',
              $type: 'VM',
            },
          },
          variableName: {
            title: 'Alarm Type',
            description: Object.keys(VM_FUNCTIONS)
              .map(k => `  * ${k} (${VM_FUNCTIONS[k].unit}): ${VM_FUNCTIONS[k].description}`)
              .join('\n'),
            type: 'string',
            default: Object.keys(VM_FUNCTIONS)[0],
            enum: Object.keys(VM_FUNCTIONS),
          },
          comparator: COMPARATOR_ENTRY,
          alarmTriggerLevel: {
            title: 'Threshold',
            description: 'The direction of the crossing is given by the comparator type',
            type: 'number',
            default: 40,
          },
          alarmTriggerPeriod: {
            title: 'Average Length (s)',
            description:
              'The points are averaged this number of seconds then the average is compared with the threshold',
            type: 'number',
            default: 60,
            enum: [60, 600],
          },
        },
        oneOf: [
          {
            properties: { uuids: {} },
            required: ['uuids'],
          },
          {
            properties: { smartMode: { const: true } },
            required: ['smartMode'],
          },
        ],
      },
    },
    srMonitors: {
      type: 'array',
      title: 'SR Monitors',
      description:
        'Alarms checking all SRs on all pools. The selected performance counter is sampled regularly and averaged. ' +
        'The Average is compared to the threshold and an alarm is raised upon crossing',
      items: {
        type: 'object',
        properties: {
          smartMode: {
            title: 'All SRs',
            type: 'boolean',
            description: 'When enabled, all SRs will be considered for the alert.',
            default: false,
          },
          uuids: {
            title: 'SRs',
            type: 'array',
            items: {
              type: 'string',
              $type: 'SR',
            },
          },
          variableName: {
            title: 'Alarm Type',
            description: Object.keys(SR_FUNCTIONS)
              .map(k => `  * ${k} (${SR_FUNCTIONS[k].unit}): ${SR_FUNCTIONS[k].description}`)
              .join('\n'),
            type: 'string',
            default: Object.keys(SR_FUNCTIONS)[0],
            enum: Object.keys(SR_FUNCTIONS),
          },
          comparator: COMPARATOR_ENTRY,
          alarmTriggerLevel: {
            title: 'Threshold',
            description: 'The direction of the crossing is given by the comparator type',
            type: 'number',
            default: 80,
          },
        },
        oneOf: [
          {
            properties: { uuids: {} },
            required: ['uuids'],
          },
          {
            properties: { smartMode: { const: true } },
            required: ['smartMode'],
          },
        ],
      },
    },
    toEmails: {
      type: 'array',
      title: 'Email addresses',
      description: 'Email addresses of the alert recipients',
      items: {
        type: 'string',
      },
      minItems: 1,
    },
  },
}

const clearCurrentAlarms = () =>
  forOwn(currentAlarms, (v, k) => {
    delete currentAlarms[k]
  })

const raiseOrLowerAlarm = (alarmId, shouldRaise, raiseCallback, lowerCallback) => {
  const current = currentAlarms[alarmId]
  if (shouldRaise) {
    if (!current) {
      currentAlarms[alarmId] = true
      raiseCallback(alarmId)
    }
  } else if (current) {
    try {
      lowerCallback(alarmId)
    } finally {
      delete currentAlarms[alarmId]
    }
  }
}

async function getServerTimestamp(xapi, host) {
  const serverLocalTime = await xapi.call('host.get_servertime', host.$ref)
  return Math.floor(utcParse('%Y%m%dT%H:%M:%SZ')(serverLocalTime).getTime() / 1000)
}

class PerfAlertXoPlugin {
  constructor(xo) {
    this._xo = xo
    this._job = createSchedule('* * * * *').createJob(async () => {
      try {
        await this._checkMonitors()
      } catch (error) {
        console.error('[WARN] scheduled function:', (error && error.stack) || error)
      }
    })
  }

  async configure(configuration) {
    this._configuration = configuration
    clearCurrentAlarms()
  }

  load() {
    this._job.start()
  }

  unload() {
    this._job.stop()
  }

  _generateUrl(type, object) {
    const { baseUrl } = this._configuration
    const { uuid } = object
    switch (type) {
      case 'vm':
        return `${baseUrl}#/vms/${uuid}/stats`
      case 'host':
        return `${baseUrl}#/hosts/${uuid}/stats`
      case 'sr':
        return `${baseUrl}#/srs/${uuid}/general`
      default:
        return 'unknown type'
    }
  }

  async test() {
    const monitorBodies = await Promise.all(
      map(
        this._getMonitors(),
        async m => `
## Monitor for ${m.title}

${(await m.snapshot()).map(entry => entry.listItem).join('')}`
      )
    )

    this._sendAlertEmail(
      'TEST',
      `
# Performance Alert Test
Your alarms and their current status:
${monitorBodies.join('\n')}`
    )
  }

  _parseDefinition(definition, cache) {
    const { objectType } = definition
    const lcObjectType = objectType.toLowerCase()
    const alarmId = `${lcObjectType}|${definition.variableName}|${definition.alarmTriggerLevel}`
    const typeFunction = TYPE_FUNCTION_MAP[lcObjectType][definition.variableName]
    const parseData = (result, uuid) => {
      const parsedLegend = result.meta.legend.map((l, index) => {
        const [operation, type, uuid, name] = l.split(':')
        const parsedName = name.split('_')
        const lastComponent = parsedName[parsedName.length - 1]
        const relatedEntity = parsedName.length > 1 && lastComponent.match(/^[0-9a-f]{8}$/) ? lastComponent : null
        return {
          operation,
          type,
          uuid,
          name,
          relatedEntity,
          parsedName,
          index,
        }
      })
      const legendTree = {}
      const getNode = (element, name, defaultValue = {}) => {
        const child = element[name]
        if (child === undefined) {
          element[name] = defaultValue
          return defaultValue
        }
        return child
      }
      parsedLegend.forEach(l => {
        const root = getNode(legendTree, l.uuid)
        const relatedNode = getNode(root, l.relatedEntity)
        relatedNode[l.name] = l
      })
      const parser = typeFunction.createParser(
        definition.comparator,
        parsedLegend.filter(l => l.uuid === uuid),
        definition.alarmTriggerLevel
      )
      result.data.forEach(d => parser.parseRow(d))
      return parser
    }
    const observationPeriod = definition.alarmTriggerPeriod !== undefined ? definition.alarmTriggerPeriod : 60
    return {
      ...definition,
      alarmId,
      vmFunction: typeFunction,
      title: `${typeFunction.name} ${definition.comparator} ${definition.alarmTriggerLevel}${typeFunction.unit}`,
      snapshot: async () => {
        return Promise.all(
          map(
            definition.smartMode
              ? filter(
                  this._xo.getObjects(),
                  obj =>
                    obj.type === objectType &&
                    ((objectType !== 'VM' && objectType !== 'host') || obj.power_state === 'Running')
                ).map(obj => obj.uuid)
              : definition.uuids,
            async uuid => {
              try {
                const result = {
                  uuid,
                  object: this._xo.getXapi(uuid).getObject(uuid),
                }

                if (result.object === undefined) {
                  throw new Error('object not found')
                }

                result.objectLink = `[${result.object.name_label}](${this._generateUrl(lcObjectType, result.object)})`

                if (typeFunction.createGetter === undefined) {
                  // Stats via RRD
                  result.rrd = await this.getRrd(result.object, observationPeriod, cache)
                  if (result.rrd !== null) {
                    const data = parseData(result.rrd, result.object.uuid)
                    Object.assign(result, {
                      data,
                      value: data.getDisplayableValue(),
                      shouldAlarm: data.shouldAlarm(),
                      threshold: data.threshold,
                      observationPeriod,
                    })
                  }
                } else {
                  // Stats via XAPI
                  const getter = typeFunction.createGetter(definition.comparator, definition.alarmTriggerLevel)
                  const data = getter(result.object)
                  Object.assign(result, {
                    value: data.getDisplayableValue(),
                    shouldAlarm: data.shouldAlarm(),
                    threshold: data.threshold,
                    observationPeriod,
                  })
                }

                const checkManagementAgent = (vm, guestMetrics) => {
                  if ((vm.power_state !== 'Running' && vm.power_state !== 'Paused') || guestMetrics === undefined) {
                    return false
                  }

                  const { major, minor } = guestMetrics.PV_drivers_version
                  const hasPvVersion = major !== undefined && minor !== undefined
                  return hasPvVersion || guestMetrics.other['feature-static-ip-setting'] === '1'
                }

                if (lcObjectType === 'vm' && definition.variableName === 'memoryUsage') {
                  const vm = result.object
                  const guestMetrics = this._xo.getXapi(uuid).getObject(vm.guest_metrics)

                  const managementAgentDetected = checkManagementAgent(vm, guestMetrics)

                  result.listItem = `  * ${result.objectLink}: ${
                    result.value === undefined
                      ? "**Can't read performance counters**"
                      : !managementAgentDetected
                        ? 'Guest tools must be installed'
                        : result.value.toFixed(1) + typeFunction.unit
                  }\n`
                }

                result.listItem = `  * ${result.objectLink}: ${
                  result.value === undefined
                    ? "**Can't read performance counters**"
                    : result.value.toFixed(1) + typeFunction.unit
                }\n`

                return result
              } catch (error) {
                logger.warn(error)
                return {
                  uuid,
                  object: null,
                  objectLink: `cannot find object ${uuid}`,
                  listItem: `  * ${uuid}: **Can't read performance counters**\n`,
                }
              }
            }
          )
        )
      },
    }
  }

  _getMonitors() {
    const cache = {}
    return map(this._configuration.hostMonitors, def => this._parseDefinition({ ...def, objectType: 'host' }, cache))
      .concat(map(this._configuration.vmMonitors, def => this._parseDefinition({ ...def, objectType: 'VM' }, cache)))
      .concat(map(this._configuration.srMonitors, def => this._parseDefinition({ ...def, objectType: 'SR' })))
  }

  // Sample of a monitor
  //  {
  //    uuids: ['8485ea1f-b475-f6f2-58a7-895ab626ce5d'],
  //    variableName: 'cpuUsage',
  //    comparator: '>',
  //    alarmTriggerLevel: 50,
  //    alarmTriggerPeriod: 60,
  //    objectType: 'host',
  //    alarmId: 'host|cpuUsage|50',
  //    title: 'host CPU usage > 50',
  //    vmFunction: {
  //      name: 'host CPU usage',
  //      description: 'Raises an alarm when the average usage of any CPU is higher/lower than the threshold',
  //      unit: '%',
  //      createParser: [Function: createParser],
  //    },
  //    snapshot: [Function: snapshot],
  //  }
  //
  // Sample of an entry of a snapshot
  //  {
  //    uuid: '8485ea1f-b475-f6f2-58a7-895ab626ce5d',
  //    object: host,
  //    objectLink: '[lab1](localhost:3000#/hosts/485ea1f-b475-f6f2-58a7-895ab626ce5d/stats)'
  //    rrd: stats,
  //    data: {
  //      parseRow: [Function: parseRow],
  //      getDisplayableValue: [Function: getDisplayableValue],
  //      shouldAlarm: [Function: shouldAlarm],
  //    },
  //    value: 70,
  //    shouldAlarm: true,
  //    listItem: '  * [lab1](localhost:3000#/hosts/485ea1f-b475-f6f2-58a7-895ab626ce5d/stats): 70%\n'
  //  }
  async _checkMonitors() {
    const monitors = this._getMonitors()
    for (const monitor of monitors) {
      const snapshot = await monitor.snapshot()

      const entriesWithMissingStats = []
      for (const entry of snapshot) {
        //  can happen when the user forgets to remove an element that doesn't exist anymore from the list of the monitored machines
        if (entry.object === null) continue
        if (entry.value === undefined) {
          entriesWithMissingStats.push(entry)
          continue
        }
        // Ignore special SRs (e.g. *XCP-ng Tools*, *DVD drives*, etc) as their usage is always 100%
        if (entry.object.physical_size <= 0 && entry.object.content_type === 'iso') continue

        const raiseAlarm = _alarmId => {
          // sample XenCenter message (linebreaks are meaningful):
          // value: 1.242087\n config: <variable>\n <name value="mem_usage"/>\n<alarm_trigger_level value="0.5"/>\n <alarm_trigger_period value ="60"/>\n</variable>
          this._xo.getXapi(entry.object.uuid).call(
            'message.create',
            'ALARM',
            3,
            entry.object.$type,
            entry.object.uuid,
            `value: ${(entry.value / 100).toFixed(1)}
config:
<variable>
<name value="${XAPI_TO_XENCENTER[monitor.variableName]}"/>
<alarm_trigger_level value="${entry.threshold / 100}"/>
<alarm_trigger_period value ="${entry.observationPeriod}"/>
</variable>`
          )
          this._sendAlertEmail(
            '',
            `
## ALERT: ${monitor.title}
${entry.listItem}
### Description
  ${monitor.vmFunction.description}`
          )
        }

        const lowerAlarm = _alarmId => {
          this._sendAlertEmail(
            'END OF ALERT',
            `
## END OF ALERT: ${monitor.title}
${entry.listItem}
### Description
  ${monitor.vmFunction.description}`
          )
        }

        raiseOrLowerAlarm(`${monitor.alarmId}|${entry.uuid}`, entry.shouldAlarm, raiseAlarm, lowerAlarm)
      }

      raiseOrLowerAlarm(
        `${monitor.alarmId}|${entriesWithMissingStats
          .map(({ uuid }) => uuid)
          .sort()
          .join('|')}|RRD`,
        entriesWithMissingStats.length !== 0,
        () => {
          this._sendAlertEmail(
            'Secondary Issue',
            `
## There was an issue when trying to check ${monitor.title}
${entriesWithMissingStats.map(({ listItem }) => listItem).join('\n')}`
          )
        },
        () => {}
      )
    }
  }

  _sendAlertEmail(subjectSuffix, markdownBody) {
    if (this._configuration.toEmails !== undefined && this._xo.sendEmail !== undefined) {
      this._xo.sendEmail({
        to: this._configuration.toEmails,
        subject: `[Xen Orchestra] − Performance Alert ${subjectSuffix}`,
        markdown:
          markdownBody +
          `\n\n\nSent from Xen Orchestra [perf-alert plugin](${this._configuration.baseUrl}#/settings/plugins)\n`,
      })
    } else {
      throw new Error('The email alert system has a configuration issue.')
    }
  }

  async getRrd(xapiObject, secondsAgo, hostCache = {}) {
    const host = xapiObject.$type === 'host' ? xapiObject : xapiObject.$resident_on
    if (host == null) {
      return null
    }
    const xapi = this._xo.getXapi(host.uuid)
    if (hostCache[host.uuid] === undefined) {
      hostCache[host.uuid] = getServerTimestamp(xapi, host)
        .then(serverTimestamp => {
          const payload = {
            host,
            query: {
              cf: 'AVERAGE',
              host: 'true',
              json: 'true',
              start: serverTimestamp - secondsAgo,
            },
          }
          return xapi.getResource('/rrd_updates', payload)
        })
        .then(res => res.body.text())
        .then(text => JSON5.parse(text))
        .catch(err => {
          delete hostCache[host.uuid]
          throw err
        })
    }
    // reuse an existing/in flight query
    const json = await hostCache[host.uuid]
    const results = {
      meta: { ...json.meta, legend: [] },
      data: [],
    }
    if (json.data.length > 0) {
      // copy only the data relevant the object
      const data = [...json.data]

      let firstPass = true
      json.meta.legend.forEach((legend, index) => {
        const [, , /* type */ uuidInStat /* metricType */] = /^AVERAGE:([^:]+):(.+):(.+)$/.exec(legend)
        if (uuidInStat !== xapiObject.uuid) {
          return
        }
        results.meta.legend.push(legend)
        let timestampIndex = 0
        for (const { t, values } of data) {
          if (firstPass) {
            results.data.push({ t, values: [] })
          }
          assert.strictEqual(results.data[timestampIndex].t, t)
          results.data[timestampIndex].values.push(values[index])
          timestampIndex++
        }
        firstPass = false
      })
    }
    return results
  }
}

exports.default = function ({ xo }) {
  return new PerfAlertXoPlugin(xo)
}

/* example legend fields:
host : memory_total_kib
host : memory_free_kib
host : cpu_avg
host : cpu3
host : cpu2
host : cpu1
host : cpu0
host : loadavg
host : CPU3-avg-freq
host : CPU2-avg-freq
host : CPU1-avg-freq
host : CPU0-avg-freq
host : cpu3-P15
host : cpu3-P14
host : cpu3-P13
host : cpu3-P12
host : cpu3-P11
host : cpu3-P10
host : cpu3-P9
host : cpu3-P8
host : cpu3-P7
host : cpu3-P6
host : cpu3-P5
host : cpu3-P4
host : cpu3-P3
host : cpu3-P2
host : cpu3-P1
host : cpu3-P0
host : cpu2-P15
host : cpu2-P14
host : cpu2-P13
host : cpu2-P12
host : cpu2-P11
host : cpu2-P10
host : cpu2-P9
host : cpu2-P8
host : cpu2-P7
host : cpu2-P6
host : cpu2-P5
host : cpu2-P4
host : cpu2-P3
host : cpu2-P2
host : cpu2-P1
host : cpu2-P0
host : cpu1-P15
host : cpu1-P14
host : cpu1-P13
host : cpu1-P12
host : cpu1-P11
host : cpu1-P10
host : cpu1-P9
host : cpu1-P8
host : cpu1-P7
host : cpu1-P6
host : cpu1-P5
host : cpu1-P4
host : cpu1-P3
host : cpu1-P2
host : cpu1-P1
host : cpu1-P0
host : cpu0-P15
host : cpu0-P14
host : cpu0-P13
host : cpu0-P12
host : cpu0-P11
host : cpu0-P10
host : cpu0-P9
host : cpu0-P8
host : cpu0-P7
host : cpu0-P6
host : cpu0-P5
host : cpu0-P4
host : cpu0-P3
host : cpu0-P2
host : cpu0-P1
host : cpu0-P0
host : cpu3-C6
host : cpu3-C5
host : cpu3-C4
host : cpu3-C3
host : cpu3-C2
host : cpu3-C1
host : cpu3-C0
host : cpu2-C6
host : cpu2-C5
host : cpu2-C4
host : cpu2-C3
host : cpu2-C2
host : cpu2-C1
host : cpu2-C0
host : cpu1-C6
host : cpu1-C5
host : cpu1-C4
host : cpu1-C3
host : cpu1-C2
host : cpu1-C1
host : cpu1-C0
host : cpu0-C6
host : cpu0-C5
host : cpu0-C4
host : cpu0-C3
host : cpu0-C2
host : cpu0-C1
host : cpu0-C0
host : Tapdisks_in_low_memory_mode
host : memory_reclaimed_max
host : memory_reclaimed
host : pif_aggr_rx
host : pif_aggr_tx
host : pif_eth2_rx
host : pif_eth2_tx
host : pif_eth0_rx
host : pif_eth0_tx
host : pif_eth1_rx
host : pif_eth1_tx
host : xapi_open_fds
host : pool_task_count
host : pool_session_count
host : xapi_memory_usage_kib
host : xapi_free_memory_kib
host : xapi_live_memory_kib
host : xapi_allocation_kib
host : inflight_2b7b1501
host : iowait_2b7b1501
host : iops_total_2b7b1501
host : iops_write_2b7b1501
host : iops_read_2b7b1501
host : io_throughput_total_2b7b1501
host : io_throughput_write_2b7b1501
host : io_throughput_read_2b7b1501
host : write_latency_2b7b1501
host : read_latency_2b7b1501
host : write_2b7b1501
host : read_2b7b1501
host : inflight_72cc0148
host : iowait_72cc0148
host : iops_total_72cc0148
host : iops_write_72cc0148
host : iops_read_72cc0148
host : io_throughput_total_72cc0148
host : io_throughput_write_72cc0148
host : io_throughput_read_72cc0148
host : write_latency_72cc0148
host : read_latency_72cc0148
host : write_72cc0148
host : read_72cc0148
host : inflight_9218facb
host : iowait_9218facb
host : iops_total_9218facb
host : iops_write_9218facb
host : iops_read_9218facb
host : io_throughput_total_9218facb
host : io_throughput_write_9218facb
host : io_throughput_read_9218facb
host : write_latency_9218facb
host : read_latency_9218facb
host : write_9218facb
host : read_9218facb
host : inflight_44f9108d
host : iowait_44f9108d
host : iops_total_44f9108d
host : iops_write_44f9108d
host : iops_read_44f9108d
host : io_throughput_total_44f9108d
host : io_throughput_write_44f9108d
host : io_throughput_read_44f9108d
host : write_latency_44f9108d
host : read_latency_44f9108d
host : write_44f9108d
host : read_44f9108d
host : inflight_438aa8dd
host : iowait_438aa8dd
host : iops_total_438aa8dd
host : iops_write_438aa8dd
host : iops_read_438aa8dd
host : io_throughput_total_438aa8dd
host : io_throughput_write_438aa8dd
host : io_throughput_read_438aa8dd
host : write_latency_438aa8dd
host : read_latency_438aa8dd
host : write_438aa8dd
host : read_438aa8dd
host : inflight_69a97fd4
host : iowait_69a97fd4
host : iops_total_69a97fd4
host : iops_write_69a97fd4
host : iops_read_69a97fd4
host : io_throughput_total_69a97fd4
host : io_throughput_write_69a97fd4
host : io_throughput_read_69a97fd4
host : write_latency_69a97fd4
host : read_latency_69a97fd4
host : write_69a97fd4
host : read_69a97fd4
host : inflight_85536572
host : iowait_85536572
host : iops_total_85536572
host : iops_write_85536572
host : iops_read_85536572
host : io_throughput_total_85536572
host : io_throughput_write_85536572
host : io_throughput_read_85536572
host : write_latency_85536572
host : read_latency_85536572
host : write_85536572
host : read_85536572
host : inflight_d4a3c32d
host : iowait_d4a3c32d
host : iops_total_d4a3c32d
host : iops_write_d4a3c32d
host : iops_read_d4a3c32d
host : io_throughput_total_d4a3c32d
host : io_throughput_write_d4a3c32d
host : io_throughput_read_d4a3c32d
host : write_latency_d4a3c32d
host : read_latency_d4a3c32d
host : write_d4a3c32d
host : read_d4a3c32d
host : inflight_c5bb6dc6
host : iowait_c5bb6dc6
host : iops_total_c5bb6dc6
host : iops_write_c5bb6dc6
host : iops_read_c5bb6dc6
host : io_throughput_total_c5bb6dc6
host : io_throughput_write_c5bb6dc6
host : io_throughput_read_c5bb6dc6
host : write_latency_c5bb6dc6
host : read_latency_c5bb6dc6
host : write_c5bb6dc6
host : read_c5bb6dc6
vm : cpu1
vm : cpu0
vm : memory
vm : vbd_xvda_inflight
vm : vbd_xvda_iowait
vm : vbd_xvda_iops_total
vm : vbd_xvda_iops_write
vm : vbd_xvda_iops_read
vm : vbd_xvda_io_throughput_total
vm : vbd_xvda_io_throughput_write
vm : vbd_xvda_io_throughput_read
vm : vbd_xvda_write_latency
vm : vbd_xvda_read_latency
vm : vbd_xvda_write
vm : vbd_xvda_read
vm : vbd_xvdb_inflight
vm : vbd_xvdb_iowait
vm : vbd_xvdb_iops_total
vm : vbd_xvdb_iops_write
vm : vbd_xvdb_iops_read
vm : vbd_xvdb_io_throughput_total
vm : vbd_xvdb_io_throughput_write
vm : vbd_xvdb_io_throughput_read
vm : vbd_xvdb_write_latency
vm : vbd_xvdb_read_latency
vm : vbd_xvdb_write
vm : vbd_xvdb_read
vm : vif_0_tx
vm : vif_0_rx
vm : memory_target
vm : memory_internal_free
 */
