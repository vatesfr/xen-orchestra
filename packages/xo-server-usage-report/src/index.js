import Handlebars from 'handlebars'
import { createSchedule } from '@xen-orchestra/cron'
import { minify } from 'html-minifier'
import {
  assign,
  concat,
  differenceBy,
  filter,
  find,
  forEach,
  isFinite,
  map,
  orderBy,
  round,
  values,
  zipObject,
} from 'lodash'
import { promisify } from 'promise-toolbox'
import { readFile, writeFile } from 'fs'

// ===================================================================

const pReadFile = promisify(readFile)
const pWriteFile = promisify(writeFile)

const currDate = new Date().toISOString().slice(0, 10)

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
pReadFile(`${__dirname}/../report.html.tpl`, 'utf8').then(tpl => {
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
pReadFile(`${__dirname}/../images/xo.png`, 'base64').then(data => {
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
      enum: ['monthly', 'weekly'],
      description:
        'If you choose weekly you will receive the report every sunday and if you choose monthly you will receive it every first day of the month.',
    },
  },

  additionalProperties: false,
  required: ['emails', 'periodicity'],
}

// ===================================================================

Handlebars.registerHelper('compare', function (
  lvalue,
  operator,
  rvalue,
  options
) {
  if (arguments.length < 3) {
    throw new Error('Handlebars Helper "compare" needs 2 parameters')
  }

  if (!compareOperators[operator]) {
    throw new Error(
      `Handlebars Helper "compare" doesn't know the operator ${operator}`
    )
  }

  return compareOperators[operator](lvalue, rvalue)
    ? options.fn(this)
    : options.inverse(this)
})

Handlebars.registerHelper('math', function (lvalue, operator, rvalue, options) {
  if (arguments.length < 3) {
    throw new Error('Handlebars Helper "math" needs 2 parameters')
  }

  if (!mathOperators[operator]) {
    throw new Error(
      `Handlebars Helper "math" doesn't know the operator ${operator}`
    )
  }

  return mathOperators[operator](+lvalue, +rvalue)
})

Handlebars.registerHelper('shortUUID', uuid => {
  if (typeof uuid === 'string') {
    return uuid.split('-')[0]
  }
})

Handlebars.registerHelper(
  'normaliseValue',
  value => (isFinite(value) ? round(value, 2) : '-')
)

Handlebars.registerHelper(
  'normaliseEvolution',
  value => (isFinite(+value) ? `(${value > 0 ? '+' : ''}${value} %)` : '')
)

// ===================================================================

function computeMean (values) {
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

const computeDoubleMean = val => computeMean(val.map(computeMean))

function computeMeans (objects, options) {
  return zipObject(
    options,
    map(options, opt => round(computeMean(map(objects, opt)), 2))
  )
}

function getTop (objects, options) {
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
          value: round(obj[opt], 2),
        })
      )
    )
  )
}

function computePercentage (curr, prev, options) {
  return zipObject(
    options,
    map(
      options,
      opt =>
        prev[opt] === 0 || prev[opt] === null
          ? 'NONE'
          : `${round((curr[opt] - prev[opt]) * 100 / prev[opt], 2)}`
    )
  )
}

function getDiff (oldElements, newElements) {
  return {
    added: differenceBy(newElements, oldElements, 'uuid'),
    removed: differenceBy(oldElements, newElements, 'uuid'),
  }
}

// ===================================================================

function getVmsStats ({ runningVms, xo }) {
  return Promise.all(
    map(runningVms, async vm => {
      const vmStats = await xo.getXapiVmStats(vm, 'days')
      return {
        uuid: vm.uuid,
        name: vm.name_label,
        cpu: computeDoubleMean(vmStats.stats.cpus),
        ram: computeMean(vmStats.stats.memoryUsed) / gibPower,
        diskRead: computeDoubleMean(values(vmStats.stats.xvds.r)) / mibPower,
        diskWrite: computeDoubleMean(values(vmStats.stats.xvds.w)) / mibPower,
        netReception: computeDoubleMean(vmStats.stats.vifs.rx) / kibPower,
        netTransmission: computeDoubleMean(vmStats.stats.vifs.tx) / kibPower,
      }
    })
  )
}

function getHostsStats ({ runningHosts, xo }) {
  return Promise.all(
    map(runningHosts, async host => {
      const hostStats = await xo.getXapiHostStats(host, 'days')
      return {
        uuid: host.uuid,
        name: host.name_label,
        cpu: computeDoubleMean(hostStats.stats.cpus),
        ram: computeMean(hostStats.stats.memoryUsed) / gibPower,
        load: computeMean(hostStats.stats.load),
        netReception: computeDoubleMean(hostStats.stats.pifs.rx) / kibPower,
        netTransmission: computeDoubleMean(hostStats.stats.pifs.tx) / kibPower,
      }
    })
  )
}

function getSrsStats (xoObjects) {
  return map(filter(xoObjects, { type: 'SR' }), sr => {
    const total = sr.size / gibPower
    const used = sr.physical_usage / gibPower
    return {
      uuid: sr.uuid,
      name: sr.name_label,
      total,
      used,
      free: total - used,
    }
  })
}

function computeGlobalVmsStats ({ haltedVms, vmsStats, xo }) {
  const allVms = concat(
    map(vmsStats, vm => ({
      uuid: vm.uuid,
      name: vm.name,
    })),
    map(haltedVms, vm => ({
      uuid: vm.uuid,
      name: vm.name_label,
    }))
  )

  return assign(
    computeMeans(vmsStats, [
      'cpu',
      'ram',
      'diskRead',
      'diskWrite',
      'netReception',
      'netTransmission',
    ]),
    {
      number: allVms.length,
      allVms,
    }
  )
}

function computeGlobalHostsStats ({ haltedHosts, hostsStats, xo }) {
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

  return assign(
    computeMeans(hostsStats, [
      'cpu',
      'ram',
      'load',
      'netReception',
      'netTransmission',
    ]),
    {
      number: allHosts.length,
      allHosts,
    }
  )
}

function getTopVms ({ vmsStats, xo }) {
  return getTop(vmsStats, [
    'cpu',
    'ram',
    'diskRead',
    'diskWrite',
    'netReception',
    'netTransmission',
  ])
}

function getTopHosts ({ hostsStats, xo }) {
  return getTop(hostsStats, [
    'cpu',
    'ram',
    'load',
    'netReception',
    'netTransmission',
  ])
}

function getTopSrs ({ srsStats, xo }) {
  return getTop(srsStats, ['total']).total
}

async function getHostsMissingPatches ({ runningHosts, xo }) {
  const hostsMissingPatches = await Promise.all(
    map(runningHosts, async host => {
      let hostsPatches = await xo
        .getXapi(host)
        .listMissingPoolPatchesOnHost(host._xapiId)

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

function getAllUsersEmail (users) {
  return map(users, 'email')
}

async function storeStats ({ data, storedStatsPath }) {
  await pWriteFile(storedStatsPath, JSON.stringify(data))
}

async function computeEvolution ({ storedStatsPath, ...newStats }) {
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
      ...computePercentage(
        newStatsHosts,
        oldStatsHosts,
        resourcesOptions.hosts
      ),
    }

    const vmsResourcesEvolution = getDiff(
      oldStatsVms.allVms,
      newStatsVms.allVms
    )
    const hostsResourcesEvolution = getDiff(
      oldStatsHosts.allHosts,
      newStatsHosts.allHosts
    )

    const usersEvolution = getDiff(oldStats.users, newStats.users)

    const newAllRessourcesStats = newStats.allResources
    const oldAllRessourcesStats = oldStats.allResources

    // adding for each resource its evolution
    if (
      newAllRessourcesStats !== undefined &&
      oldAllRessourcesStats !== undefined
    ) {
      forEach(newAllRessourcesStats, (resource, key) => {
        const option = resourcesOptions[key]

        if (option !== undefined) {
          forEach(resource, newItem => {
            const oldItem = find(oldAllRessourcesStats[key], {
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

async function dataBuilder ({ xo, storedStatsPath, all }) {
  const xoObjects = values(xo.getObjects())
  const runningVms = filter(xoObjects, { type: 'VM', power_state: 'Running' })
  const haltedVms = filter(xoObjects, { type: 'VM', power_state: 'Halted' })
  const runningHosts = filter(xoObjects, {
    type: 'host',
    power_state: 'Running',
  })
  const haltedHosts = filter(xoObjects, { type: 'host', power_state: 'Halted' })
  const [
    users,
    vmsStats,
    hostsStats,
    srsStats,
    hostsMissingPatches,
  ] = await Promise.all([
    xo.getAllUsers(),
    getVmsStats({ xo, runningVms }),
    getHostsStats({ xo, runningHosts }),
    getSrsStats(xoObjects),
    getHostsMissingPatches({ xo, runningHosts }),
  ])

  const [
    globalVmsStats,
    globalHostsStats,
    topVms,
    topHosts,
    topSrs,
    usersEmail,
  ] = await Promise.all([
    computeGlobalVmsStats({ xo, vmsStats, haltedVms }),
    computeGlobalHostsStats({ xo, hostsStats, haltedHosts }),
    getTopVms({ xo, vmsStats }),
    getTopHosts({ xo, hostsStats }),
    getTopSrs({ xo, srsStats }),
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

class UsageReportPlugin {
  constructor ({ xo, getDataDir }) {
    this._xo = xo
    this._dir = getDataDir
    // Defined in configure().
    this._conf = null
  }

  configure (configuration, state) {
    this._conf = configuration

    if (this._job !== undefined) {
      this._job.stop()
    }

    this._job = createSchedule(
      configuration.periodicity === 'monthly' ? '00 06 1 * *' : '00 06 * * 0'
    ).createJob(async () => {
      try {
        await this._sendReport()
      } catch (error) {
        console.error(
          '[WARN] scheduled function:',
          (error && error.stack) || error
        )
      }
    })

    if (state.loaded) {
      this._job.start()
    }
  }

  async load () {
    const dir = await this._dir()
    this._storedStatsPath = `${dir}/stats.json`

    this._job.start()
  }

  unload () {
    this._job.stop()
  }

  test () {
    return this._sendReport()
  }

  async _sendReport () {
    const data = await dataBuilder({
      xo: this._xo,
      storedStatsPath: this._storedStatsPath,
      all: this._conf.all,
    })

    await Promise.all([
      this._xo.sendEmail({
        to: this._conf.emails,
        subject: `[Xen Orchestra] Xo Report - ${currDate}`,
        markdown: `Hi there,

  You have chosen to receive your xo report ${this._conf.periodicity}.
  Please, find the attached report.

  best regards.`,
        attachments: [
          {
            filename: `xoReport_${currDate}.html`,
            content: template(data),
          },
        ],
      }),
      storeStats({
        data,
        storedStatsPath: this._storedStatsPath,
      }),
    ])
  }
}

// ===================================================================

export default opts => new UsageReportPlugin(opts)
