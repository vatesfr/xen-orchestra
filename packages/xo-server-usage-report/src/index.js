import Handlebars from 'handlebars'
import { createSchedule } from '@xen-orchestra/cron'
import { minify } from 'html-minifier'
import {
  assign,
  concat,
  differenceBy,
  filter,
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
    throw new Error('Handlerbars Helper "compare" needs 2 parameters')
  }

  if (!compareOperators[operator]) {
    throw new Error(
      `Handlerbars Helper "compare" doesn't know the operator ${operator}`
    )
  }

  return compareOperators[operator](lvalue, rvalue)
    ? options.fn(this)
    : options.inverse(this)
})

Handlebars.registerHelper('math', function (lvalue, operator, rvalue, options) {
  if (arguments.length < 3) {
    throw new Error('Handlerbars Helper "math" needs 2 parameters')
  }

  if (!mathOperators[operator]) {
    throw new Error(
      `Handlerbars Helper "math" doesn't know the operator ${operator}`
    )
  }

  return mathOperators[operator](+lvalue, +rvalue)
})

Handlebars.registerHelper('shortUUID', uuid => {
  if (typeof uuid === 'string') {
    return uuid.split('-')[0]
  }
})

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

function conputePercentage (curr, prev, options) {
  return zipObject(
    options,
    map(
      options,
      opt =>
        prev[opt] === 0
          ? 'NONE'
          : `${round((curr[opt] - prev[opt]) * 100 / prev[opt], 2)}`
    )
  )
}

function getDiff (oldElements, newElements) {
  return {
    added: differenceBy(oldElements, newElements, 'uuid'),
    removed: differenceBy(newElements, oldElements, 'uuid'),
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

function getMostAllocatedSpaces ({ disks, xo }) {
  return map(orderBy(disks, ['size'], ['desc']).slice(0, 3), disk => ({
    uuid: disk.uuid,
    name: disk.name_label,
    size: round(disk.size / gibPower, 2),
  }))
}

async function getHostsMissingPatches ({ runningHosts, xo }) {
  const hostsMissingPatches = await Promise.all(
    map(runningHosts, async host => {
      const hostsPatches = await xo
        .getXapi(host)
        .listMissingPoolPatchesOnHost(host._xapiId)
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

    const vmsEvolution = {
      number: newStatsVms.number - oldStatsVms.number,
      ...conputePercentage(newStatsVms, oldStatsVms, [
        'cpu',
        'ram',
        'diskRead',
        'diskWrite',
        'netReception',
        'netTransmission',
      ]),
    }

    const hostsEvolution = {
      number: newStatsHosts.number - oldStatsHosts.number,
      ...conputePercentage(newStatsHosts, oldStatsHosts, [
        'cpu',
        'ram',
        'load',
        'netReception',
        'netTransmission',
      ]),
    }

    const vmsRessourcesEvolution = getDiff(
      oldStatsVms.allVms,
      newStatsVms.allVms
    )
    const hostsRessourcesEvolution = getDiff(
      oldStatsHosts.allHosts,
      newStatsHosts.allHosts
    )

    const usersEvolution = getDiff(oldStats.users, newStats.users)

    return {
      vmsEvolution,
      hostsEvolution,
      prevDate,
      vmsRessourcesEvolution,
      hostsRessourcesEvolution,
      usersEvolution,
    }
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
  }
}

async function dataBuilder ({ xo, storedStatsPath }) {
  const xoObjects = values(xo.getObjects())
  const runningVms = filter(xoObjects, { type: 'VM', power_state: 'Running' })
  const haltedVms = filter(xoObjects, { type: 'VM', power_state: 'Halted' })
  const runningHosts = filter(xoObjects, {
    type: 'host',
    power_state: 'Running',
  })
  const haltedHosts = filter(xoObjects, { type: 'host', power_state: 'Halted' })
  const disks = filter(xoObjects, { type: 'SR' })
  const [
    users,
    vmsStats,
    hostsStats,
    topAllocation,
    hostsMissingPatches,
  ] = await Promise.all([
    xo.getAllUsers(),
    getVmsStats({ xo, runningVms }),
    getHostsStats({ xo, runningHosts }),
    getMostAllocatedSpaces({ xo, disks }),
    getHostsMissingPatches({ xo, runningHosts }),
  ])

  const [
    globalVmsStats,
    globalHostsStats,
    topVms,
    topHosts,
    usersEmail,
  ] = await Promise.all([
    computeGlobalVmsStats({ xo, vmsStats, haltedVms }),
    computeGlobalHostsStats({ xo, hostsStats, haltedHosts }),
    getTopVms({ xo, vmsStats }),
    getTopHosts({ xo, hostsStats }),
    getAllUsersEmail(users),
  ])
  const evolution = await computeEvolution({
    storedStatsPath,
    hosts: globalHostsStats,
    usersEmail,
    vms: globalVmsStats,
  })

  const data = {
    global: {
      vms: globalVmsStats,
      hosts: globalHostsStats,
      vmsEvolution: evolution && evolution.vmsEvolution,
      hostsEvolution: evolution && evolution.hostsEvolution,
    },
    topVms,
    topHosts,
    hostsMissingPatches,
    usersEmail,
    topAllocation,
    vmsRessourcesEvolution: evolution && evolution.vmsRessourcesEvolution,
    hostsRessourcesEvolution: evolution && evolution.hostsRessourcesEvolution,
    usersEvolution: evolution && evolution.usersEvolution,
    style: {
      imgXo,
      currDate,
      prevDate: evolution && evolution.prevDate,
      page: '{{page}}',
    },
  }

  return data
}

// ===================================================================

class UsageReportPlugin {
  constructor ({ xo, getDataDir }) {
    this._xo = xo
    this._dir = getDataDir
    // Defined in configure().
    this._conf = null
  }

  configure (configuration) {
    this._conf = configuration
    const enabled = this.job !== undefined && this.job.enabled

    if (enabled) {
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

    if (enabled) {
      this._job.start()
    }
  }

  async load () {
    const dir = await this._dir()
    this._storedStatsPath = `${dir}/stats.json`

    this._job.start()
    this._job.enabled = true
  }

  unload () {
    this._job.stop()
    this._job.enabled = false
  }

  test () {
    return this._sendReport()
  }

  async _sendReport () {
    const data = await dataBuilder({
      xo: this._xo,
      storedStatsPath: this._storedStatsPath,
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
