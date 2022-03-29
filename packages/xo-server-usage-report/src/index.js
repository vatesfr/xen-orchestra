import asyncMapSettled from '@xen-orchestra/async-map/legacy'
import Handlebars from 'handlebars'
import humanFormat from 'human-format'
import { stringify } from 'csv-stringify'
import { createLogger } from '@xen-orchestra/log'
import { createSchedule } from '@xen-orchestra/cron'
import { join } from 'path'
import { minify } from 'html-minifier'
import {
  concat,
  differenceBy,
  filter,
  find,
  forEach,
  get,
  isFinite,
  map,
  orderBy,
  round,
  values,
  zipObject,
} from 'lodash'
import { ignoreErrors, promisify } from 'promise-toolbox'
import { readFile, writeFile } from 'fs'

// ===================================================================

const log = createLogger('xo:xo-server-usage-report')

const GRANULARITY = 'days'

const pReadFile = promisify(readFile)
const pWriteFile = promisify(writeFile)

const compareOperators = {
  '>': (l, r) => l > r,
}
const mathOperators = {
  '+': (l, r) => l + r,
}

const gibPower = Math.pow(2, 30)
const mibPower = Math.pow(2, 20)
const kibPower = Math.pow(2, 10)

let template = null
pReadFile(join(__dirname, '../report.html.tpl'), 'utf8').then(tpl => {
  template = Handlebars.compile(
    minify(tpl, {
      collapseBooleanAttributes: true,
      collapseWhitespace: true,
      minifyCSS: true,
      removeAttributeQuotes: true,
      removeComments: true,
      removeOptionalTags: true,
      removeRedundantAttributes: true,
    })
  )
})

let imgXo = null
pReadFile(join(__dirname, '../images/xo.png'), 'base64').then(data => {
  imgXo = `data:image/png;base64,${data}`
})

// ===================================================================

export const configurationSchema = {
  type: 'object',

  properties: {
    emails: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    all: {
      type: 'boolean',
      description: "It includes all resources' stats if on.",
    },
    periodicity: {
      type: 'string',
      enum: ['monthly', 'weekly', 'daily'],
      description:
        'If you choose weekly you will receive the report every sunday and if you choose monthly you will receive it every first day of the month.',
    },
  },

  additionalProperties: false,
  required: ['emails', 'periodicity'],
}

// ===================================================================

const shortUuid = uuid => {
  if (typeof uuid === 'string') {
    return uuid.split('-')[0]
  }
}

const formatIops = value =>
  isFinite(value)
    ? humanFormat(value, {
        unit: 'IOPS',
        decimals: 2,
      })
    : '-'

const normaliseValue = value => (isFinite(value) ? round(value, 2) : '-')

// ===================================================================

Handlebars.registerHelper('compare', function (lvalue, operator, rvalue, options) {
  if (arguments.length < 3) {
    throw new Error('Handlebars Helper "compare" needs 2 parameters')
  }

  if (!compareOperators[operator]) {
    throw new Error(`Handlebars Helper "compare" doesn't know the operator ${operator}`)
  }

  return compareOperators[operator](lvalue, rvalue) ? options.fn(this) : options.inverse(this)
})

Handlebars.registerHelper('math', function (lvalue, operator, rvalue, options) {
  if (arguments.length < 3) {
    throw new Error('Handlebars Helper "math" needs 2 parameters')
  }

  if (!mathOperators[operator]) {
    throw new Error(`Handlebars Helper "math" doesn't know the operator ${operator}`)
  }

  return mathOperators[operator](+lvalue, +rvalue)
})

Handlebars.registerHelper('shortUUID', shortUuid)

Handlebars.registerHelper('formatAddresses', addresses =>
  addresses.length === 0 ? 'No IP record' : addresses.join(', ')
)

Handlebars.registerHelper('normaliseValue', normaliseValue)

Handlebars.registerHelper(
  'normaliseEvolution',
  value =>
    new Handlebars.SafeString(
      isFinite((value = round(value, 2))) && value !== 0
        ? value > 0
          ? `(<b style="color: green;">▲ ${value}%</b>)`
          : `(<b style="color: red;">▼ ${String(value).slice(1)}%</b>)`
        : ''
    )
)

Handlebars.registerHelper('formatIops', formatIops)

const getHeader = (label, size) => `
  <tr>
    <td rowspan='${size + 1}' class="tableHeader">${label}</td>
  </tr>
`

const getBody = ({ uuid, name, value }, transformValue, unit) => `
  <tr>
    <td>${shortUuid(uuid)}</td>
    <td>${name}</td>
    <td>${transformValue(value)}${unit !== undefined ? ` ${unit}` : ''}</td>
  </tr>
`

const getTopIops = ({ iopsRead, iopsWrite, iopsTotal }) => `
  ${getHeader('IOPS read', iopsRead.length)}
  ${iopsRead.map(obj => getBody(obj, formatIops)).join('')}
  ${getHeader('IOPS write', iopsWrite.length)}
  ${iopsWrite.map(obj => getBody(obj, formatIops)).join('')}
  ${getHeader('IOPS total', iopsTotal.length)}
  ${iopsTotal.map(obj => getBody(obj, formatIops)).join('')}
`

Handlebars.registerHelper(
  'getTopSrs',
  ({ usedSpace, iopsRead, iopsWrite, iopsTotal }) =>
    new Handlebars.SafeString(`
      ${getHeader('Used space', usedSpace.length)}
      ${usedSpace.map(obj => getBody(obj, normaliseValue, 'GiB')).join('')}
      ${getTopIops({ iopsRead, iopsWrite, iopsTotal })}
    `)
)

Handlebars.registerHelper('getTopIops', props => new Handlebars.SafeString(getTopIops(props)))

// ===================================================================

function computeMean(values) {
  let sum = 0
  let n = 0
  forEach(values, val => {
    if (isFinite(val)) {
      sum += val
      n++
    }
  })

  return sum / n
}

const computeDoubleMean = val => computeMean(map(val, computeMean))

function computeMeans(objects, options) {
  return zipObject(
    options,
    map(options, opt => computeMean(map(objects, opt)), 2)
  )
}

function getTop(objects, options) {
  return zipObject(
    options,
    map(options, opt =>
      map(
        orderBy(
          objects,
          object => {
            const value = object[opt]

            return isNaN(value) ? -Infinity : value
          },
          'desc'
        ).slice(0, 3),
        obj => ({
          uuid: obj.uuid,
          name: obj.name,
          value: obj[opt],
        })
      )
    )
  )
}

function computePercentage(curr, prev, options) {
  return zipObject(
    options,
    map(options, opt =>
      prev[opt] === 0 || prev[opt] === null ? 'NONE' : `${((curr[opt] - prev[opt]) * 100) / prev[opt]}`
    )
  )
}

function getDiff(oldElements, newElements) {
  return {
    added: differenceBy(newElements, oldElements, 'uuid'),
    removed: differenceBy(oldElements, newElements, 'uuid'),
  }
}

function getMemoryUsedMetric({ memory, memoryFree = memory }) {
  return map(memory, (value, key) => value - memoryFree[key])
}

const METRICS_MEAN = {
  cpu: computeDoubleMean,
  disk: value => computeDoubleMean(values(value)) / mibPower,
  iops: value => computeDoubleMean(values(value)),
  load: computeMean,
  net: value => computeDoubleMean(value) / kibPower,
  ram: stats => computeMean(getMemoryUsedMetric(stats)) / gibPower,
}

// ===================================================================

async function getVmsStats({ runningVms, xo }) {
  return orderBy(
    await Promise.all(
      map(runningVms, async vm => {
        const { stats } = await xo.getXapiVmStats(vm, GRANULARITY).catch(error => {
          log.warn('Error on fetching VM stats', {
            error,
            vmId: vm.id,
          })
          return {
            stats: {},
          }
        })

        const iopsRead = METRICS_MEAN.iops(get(stats.iops, 'r'))
        const iopsWrite = METRICS_MEAN.iops(get(stats.iops, 'w'))
        return {
          uuid: vm.uuid,
          name: vm.name_label,
          addresses: Object.values(vm.addresses),
          cpu: METRICS_MEAN.cpu(stats.cpus),
          ram: METRICS_MEAN.ram(stats),
          diskRead: METRICS_MEAN.disk(get(stats.xvds, 'r')),
          diskWrite: METRICS_MEAN.disk(get(stats.xvds, 'w')),
          iopsRead,
          iopsWrite,
          iopsTotal: iopsRead + iopsWrite,
          netReception: METRICS_MEAN.net(get(stats.vifs, 'rx')),
          netTransmission: METRICS_MEAN.net(get(stats.vifs, 'tx')),
        }
      })
    ),
    'name',
    'asc'
  )
}

async function getHostsStats({ runningHosts, xo }) {
  return orderBy(
    await Promise.all(
      map(runningHosts, async host => {
        const { stats } = await xo.getXapiHostStats(host, GRANULARITY).catch(error => {
          log.warn('Error on fetching host stats', {
            error,
            hostId: host.id,
          })
          return {
            stats: {},
          }
        })

        return {
          uuid: host.uuid,
          name: host.name_label,
          cpu: METRICS_MEAN.cpu(stats.cpus),
          ram: METRICS_MEAN.ram(stats),
          load: METRICS_MEAN.load(stats.load),
          netReception: METRICS_MEAN.net(get(stats.pifs, 'rx')),
          netTransmission: METRICS_MEAN.net(get(stats.pifs, 'tx')),
        }
      })
    ),
    'name',
    'asc'
  )
}

async function getSrsStats({ xo, xoObjects }) {
  return orderBy(
    await asyncMapSettled(
      filter(xoObjects, obj => obj.type === 'SR' && obj.size > 0 && obj.$PBDs.length > 0),
      async sr => {
        const totalSpace = sr.size / gibPower
        const usedSpace = sr.physical_usage / gibPower
        let name = sr.name_label
        // [Bug in XO] a SR with not container can be found (SR attached to a PBD with no host attached)
        let container
        if (!sr.shared && (container = find(xoObjects, { id: sr.$container })) !== undefined) {
          name += ` (${container.name_label})`
        }

        const { stats } = await xo.getXapiSrStats(sr.id, GRANULARITY).catch(error => {
          log.warn('Error on fetching SR stats', {
            error,
            srId: sr.id,
          })
          return {
            stats: {},
          }
        })

        const iopsRead = computeMean(get(stats.iops, 'r'))
        const iopsWrite = computeMean(get(stats.iops, 'w'))

        return {
          uuid: sr.uuid,
          name,
          total: totalSpace,
          usedSpace,
          freeSpace: totalSpace - usedSpace,
          iopsRead,
          iopsWrite,
          iopsTotal: iopsRead + iopsWrite,
        }
      }
    ),
    'name',
    'desc'
  )
}

function computeGlobalVmsStats({ haltedVms, vmsStats, xo }) {
  const allVms = vmsStats.map(vm => ({
    uuid: vm.uuid,
    name: vm.name,
  }))

  haltedVms.forEach(vm => {
    const isReplication =
      'start' in vm.blockedOperations &&
      vm.tags.some(tag => tag === 'Disaster Recovery' || tag === 'Continuous Replication')

    // Exclude replicated VMs because they keep being created/destroyed due to the implementation
    if (!isReplication) {
      allVms.push({
        uuid: vm.uuid,
        name: vm.name_label,
      })
    }
  })

  return Object.assign(
    computeMeans(vmsStats, ['cpu', 'ram', 'diskRead', 'diskWrite', 'netReception', 'netTransmission']),
    {
      number: vmsStats.length + haltedVms.length,
      allVms,
    }
  )
}

function computeGlobalHostsStats({ haltedHosts, hostsStats, xo }) {
  const allHosts = concat(
    map(hostsStats, host => ({
      uuid: host.uuid,
      name: host.name,
    })),
    map(haltedHosts, host => ({
      uuid: host.uuid,
      name: host.name_label,
    }))
  )

  return Object.assign(computeMeans(hostsStats, ['cpu', 'ram', 'load', 'netReception', 'netTransmission']), {
    number: allHosts.length,
    allHosts,
  })
}

function getTopVms({ vmsStats, xo }) {
  return getTop(vmsStats, [
    'cpu',
    'ram',
    'diskRead',
    'diskWrite',
    'iopsRead',
    'iopsWrite',
    'iopsTotal',
    'netReception',
    'netTransmission',
  ])
}

function getTopHosts({ hostsStats, xo }) {
  return getTop(hostsStats, ['cpu', 'ram', 'load', 'netReception', 'netTransmission'])
}

function getTopSrs(srsStats) {
  return getTop(srsStats, ['usedSpace', 'iopsRead', 'iopsWrite', 'iopsTotal'])
}

async function getHostsMissingPatches({ runningHosts, xo }) {
  const hostsMissingPatches = await Promise.all(
    map(runningHosts, async host => {
      let hostsPatches = await xo
        .getXapi(host)
        .listMissingPatches(host._xapiId)
        .catch(error => {
          console.error('[WARN] error on fetching hosts missing patches:', JSON.stringify(error))
          return []
        })

      if (host.license_params.sku_type === 'free') {
        hostsPatches = filter(hostsPatches, { paid: false })
      }

      if (hostsPatches.length > 0) {
        return {
          uuid: host.uuid,
          name: host.name_label,
          patches: map(hostsPatches, 'name'),
        }
      }
    })
  )
  return filter(hostsMissingPatches, host => host !== undefined)
}

function getAllUsersEmail(users) {
  return map(users, 'email')
}

async function storeStats({ data, storedStatsPath }) {
  await pWriteFile(storedStatsPath, JSON.stringify(data))
}

async function computeEvolution({ storedStatsPath, ...newStats }) {
  try {
    const oldStats = JSON.parse(await pReadFile(storedStatsPath, 'utf8'))
    const newStatsVms = newStats.vms
    const oldStatsVms = oldStats.global.vms
    const newStatsHosts = newStats.hosts
    const oldStatsHosts = oldStats.global.hosts

    const prevDate = oldStats.style.currDate

    const resourcesOptions = {
      vms: [
        'cpu',
        'ram',
        'diskRead',
        'diskWrite',
        'iopsRead',
        'iopsWrite',
        'iopsTotal',
        'netReception',
        'netTransmission',
      ],
      hosts: ['cpu', 'ram', 'load', 'netReception', 'netTransmission'],
      srs: ['total'],
    }

    const vmsEvolution = {
      number: newStatsVms.number - oldStatsVms.number,
      ...computePercentage(newStatsVms, oldStatsVms, resourcesOptions.vms),
    }

    const hostsEvolution = {
      number: newStatsHosts.number - oldStatsHosts.number,
      ...computePercentage(newStatsHosts, oldStatsHosts, resourcesOptions.hosts),
    }

    const vmsResourcesEvolution = getDiff(oldStatsVms.allVms, newStatsVms.allVms)
    const hostsResourcesEvolution = getDiff(oldStatsHosts.allHosts, newStatsHosts.allHosts)

    const usersEvolution = getDiff(oldStats.users, newStats.users)

    const newAllResourcesStats = newStats.allResources
    const oldAllResourcesStats = oldStats.allResources

    // adding for each resource its evolution
    if (newAllResourcesStats !== undefined && oldAllResourcesStats !== undefined) {
      forEach(newAllResourcesStats, (resource, key) => {
        const option = resourcesOptions[key]

        if (option !== undefined) {
          forEach(resource, newItem => {
            const oldItem = find(oldAllResourcesStats[key], {
              uuid: newItem.uuid,
            })

            if (oldItem !== undefined) {
              newItem.evolution = computePercentage(newItem, oldItem, option)
            }
          })
        }
      })
    }

    return {
      vmsEvolution,
      hostsEvolution,
      prevDate,
      vmsResourcesEvolution,
      hostsResourcesEvolution,
      usersEvolution,
    }
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
  }
}

async function dataBuilder({ currDate, xo, storedStatsPath, all }) {
  const xoObjects = values(xo.getObjects())
  const runningVms = filter(xoObjects, { type: 'VM', power_state: 'Running' })
  const haltedVms = filter(xoObjects, { type: 'VM', power_state: 'Halted' })
  const runningHosts = filter(xoObjects, {
    type: 'host',
    power_state: 'Running',
  })
  const haltedHosts = filter(xoObjects, { type: 'host', power_state: 'Halted' })
  const [users, vmsStats, hostsStats, srsStats, hostsMissingPatches] = await Promise.all([
    xo.getAllUsers(),
    getVmsStats({ xo, runningVms }),
    getHostsStats({ xo, runningHosts }),
    getSrsStats({ xo, xoObjects }),
    getHostsMissingPatches({ xo, runningHosts }),
  ])

  const [globalVmsStats, globalHostsStats, topVms, topHosts, topSrs, usersEmail] = await Promise.all([
    computeGlobalVmsStats({ xo, vmsStats, haltedVms }),
    computeGlobalHostsStats({ xo, hostsStats, haltedHosts }),
    getTopVms({ xo, vmsStats }),
    getTopHosts({ xo, hostsStats }),
    getTopSrs(srsStats),
    getAllUsersEmail(users),
  ])

  let allResources
  if (all) {
    allResources = {
      vms: vmsStats,
      hosts: hostsStats,
      srs: srsStats,
      date: currDate,
    }
  }

  const evolution = await computeEvolution({
    allResources,
    storedStatsPath,
    hosts: globalHostsStats,
    usersEmail,
    vms: globalVmsStats,
  })

  return {
    allResources,
    global: {
      vms: globalVmsStats,
      hosts: globalHostsStats,
      vmsEvolution: evolution && evolution.vmsEvolution,
      hostsEvolution: evolution && evolution.hostsEvolution,
    },
    topHosts,
    topSrs,
    topVms,
    hostsMissingPatches,
    usersEmail,
    vmsResourcesEvolution: evolution && evolution.vmsResourcesEvolution,
    hostsResourcesEvolution: evolution && evolution.hostsResourcesEvolution,
    usersEvolution: evolution && evolution.usersEvolution,
    style: {
      imgXo,
      currDate,
      prevDate: evolution && evolution.prevDate,
      page: '{{page}}',
    },
  }
}

// ===================================================================

const CRON_BY_PERIODICITY = {
  monthly: '0 6 1 * *',
  weekly: '0 6 * * 0',
  daily: '0 6 * * *',
}

// let field empty in case of "NaN" and "NONE"
const CSV_CAST = {
  number: value => (Number.isNaN(value) ? undefined : String(value)),
  string: value => (value === 'NONE' ? undefined : value),
}

const CSV_COLUMNS = {
  addresses: { key: 'addresses', header: 'IP addresses' },
  cpu: { key: 'cpu', header: 'CPU (%)' },
  cpuEvolution: { key: 'evolution.cpu', header: 'CPU evolution (%)' },
  diskRead: { key: 'diskRead', header: 'Disk read (MiB)' },
  diskReadEvolution: {
    key: 'evolution.diskRead',
    header: 'Disk read evolution (%)',
  },
  diskWrite: { key: 'diskWrite', header: 'Disk write (MiB)' },
  diskWriteEvolution: {
    key: 'evolution.diskWrite',
    header: 'Disk write evolution (%)',
  },
  iopsRead: { key: 'iopsRead', header: 'IOPS read' },
  iopsReadEvolution: {
    key: 'evolution.iopsRead',
    header: 'IOPS read evolution (%)',
  },
  iopsTotal: { key: 'iopsTotal', header: 'IOPS total' },
  iopsTotalEvolution: {
    key: 'evolution.iopsTotal',
    header: 'IOPS total evolution (%)',
  },
  iopsWrite: { key: 'iopsWrite', header: 'IOPS write' },
  iopsWriteEvolution: {
    key: 'evolution.iopsWrite',
    header: 'IOPS write evolution (%)',
  },
  load: { key: 'load', header: 'Load average' },
  loadEvolution: {
    key: 'evolution.load',
    header: 'Load average evolution (%)',
  },
  name: { key: 'name', header: 'Name' },
  netReception: { key: 'netReception', header: 'Network RX (KiB)' },
  netReceptionEvolution: {
    key: 'evolution.netReception',
    header: 'Network RX evolution (%)',
  },
  netTransmission: { key: 'netTransmission', header: 'Network TX (KiB)' },
  netTransmissionEvolution: {
    key: 'evolution.netTransmission',
    header: 'Network TX evolution (%)',
  },
  ram: { key: 'ram', header: 'RAM (GiB)' },
  ramEvolution: { key: 'evolution.ram', header: 'RAM evolution (%)' },
  spaceFree: { key: 'freeSpace', header: 'Free space (GiB)' },
  spaceTotal: { key: 'total', header: 'Total space (GiB)' },
  spaceTotalEvolution: {
    key: 'evolution.total',
    header: 'Total space evolution (%)',
  },
  spaceUsed: { key: 'usedSpace', header: 'Used space (GiB)' },
  uuid: { key: 'uuid', header: 'UUID' },
}

class UsageReportPlugin {
  constructor({ xo, getDataDir }) {
    this._xo = xo
    this._dir = getDataDir
    // Defined in configure().
    this._conf = null
    this._xo.addApiMethod('plugin.usageReport.send', this._sendReport.bind(this, false))
  }

  configure(configuration, state) {
    this._conf = configuration

    if (this._job !== undefined) {
      this._job.stop()
    }

    this._job = createSchedule(CRON_BY_PERIODICITY[configuration.periodicity]).createJob(async () => {
      try {
        await this._sendReport(true)
      } catch (error) {
        console.error('[WARN] scheduled function:', (error && error.stack) || error)
      }
    })

    if (state.loaded) {
      this._job.start()
    }
  }

  async load() {
    const dir = await this._dir()
    this._storedStatsPath = `${dir}/stats.json`

    this._job.start()
  }

  unload() {
    this._job.stop()
  }

  test() {
    return this._sendReport(true)
  }

  async _sendReport(storeData) {
    const xo = this._xo
    if (xo.sendEmail === undefined) {
      ignoreErrors.call(xo.unloadPlugin('usage-report'))
      throw new Error('The plugin usage-report requires the plugin transport-email to be loaded')
    }

    const currDate = new Date().toISOString().slice(0, 10)
    const data = await dataBuilder({
      currDate,
      xo,
      storedStatsPath: this._storedStatsPath,
      all: this._conf.all,
    })

    const attachments = [
      {
        filename: `xoReport_${currDate}.html`,
        content: template(data),
      },
    ]

    if (data.allResources !== undefined) {
      attachments.push(
        {
          filename: `xoReport_${currDate}_vms.csv`,
          content: stringify(data.allResources.vms, {
            cast: CSV_CAST,
            header: true,
            columns: [
              CSV_COLUMNS.uuid,
              CSV_COLUMNS.name,
              CSV_COLUMNS.addresses,
              CSV_COLUMNS.cpu,
              CSV_COLUMNS.cpuEvolution,
              CSV_COLUMNS.ram,
              CSV_COLUMNS.ramEvolution,
              CSV_COLUMNS.diskRead,
              CSV_COLUMNS.diskReadEvolution,
              CSV_COLUMNS.diskWrite,
              CSV_COLUMNS.diskWriteEvolution,
              CSV_COLUMNS.iopsRead,
              CSV_COLUMNS.iopsReadEvolution,
              CSV_COLUMNS.iopsWrite,
              CSV_COLUMNS.iopsWriteEvolution,
              CSV_COLUMNS.iopsTotal,
              CSV_COLUMNS.iopsTotalEvolution,
              CSV_COLUMNS.netReception,
              CSV_COLUMNS.netReceptionEvolution,
              CSV_COLUMNS.netTransmission,
              CSV_COLUMNS.netTransmissionEvolution,
            ],
          }),
        },
        {
          filename: `xoReport_${currDate}_hosts.csv`,
          content: stringify(data.allResources.hosts, {
            cast: CSV_CAST,
            header: true,
            columns: [
              CSV_COLUMNS.uuid,
              CSV_COLUMNS.name,
              CSV_COLUMNS.cpu,
              CSV_COLUMNS.cpuEvolution,
              CSV_COLUMNS.ram,
              CSV_COLUMNS.ramEvolution,
              CSV_COLUMNS.load,
              CSV_COLUMNS.loadEvolution,
              CSV_COLUMNS.netReception,
              CSV_COLUMNS.netReceptionEvolution,
              CSV_COLUMNS.netTransmission,
              CSV_COLUMNS.netTransmissionEvolution,
            ],
          }),
        },
        {
          filename: `xoReport_${currDate}_srs.csv`,
          content: stringify(data.allResources.srs, {
            cast: CSV_CAST,
            header: true,
            columns: [
              CSV_COLUMNS.uuid,
              CSV_COLUMNS.name,
              CSV_COLUMNS.spaceTotal,
              CSV_COLUMNS.spaceTotalEvolution,
              CSV_COLUMNS.spaceUsed,
              CSV_COLUMNS.spaceFree,
            ],
          }),
        }
      )
    }

    await Promise.all([
      xo.sendEmail({
        to: this._conf.emails,
        subject: `[Xen Orchestra] Xo Report - ${currDate}`,
        markdown: `Hi there,

  You have chosen to receive your xo report ${this._conf.periodicity}.
  Please, find the attached report.

  best regards.`,
        attachments,
      }),
      storeData &&
        storeStats({
          data,
          storedStatsPath: this._storedStatsPath,
        }),
    ])
  }
}

// ===================================================================

export default opts => new UsageReportPlugin(opts)
