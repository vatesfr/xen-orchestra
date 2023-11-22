#!/usr/bin/env node

import { createClient } from 'xen-api'
import archy from 'archy'
import chalk from 'chalk'
import execPromise from 'exec-promise'
import firstDefined from '@xen-orchestra/defined'
import forEach from 'lodash/forEach.js'
import humanFormat from 'human-format'
import map from 'lodash/map.js'
import orderBy from 'lodash/orderBy.js'
import pw from 'pw'

// ===================================================================

const askPassword = prompt =>
  new Promise(resolve => {
    prompt && process.stderr.write(`${prompt}: `)
    pw(resolve)
  })

const formatSize = bytes =>
  humanFormat(bytes, {
    prefix: 'Gi',
    scale: 'binary',
  })

const required = name => {
  const e = `missing required argument <${name}>`
  throw e
}

// -------------------------------------------------------------------

const STYLES = [
  [vdi => !vdi.managed, chalk.enabled ? chalk.red : label => `[unmanaged] ${label}`],
  [vdi => vdi.is_a_snapshot, chalk.enabled ? chalk.yellow : label => `[snapshot] ${label}`],
]
const getStyle = vdi => {
  for (let i = 0, n = STYLES.length; i < n; ++i) {
    const entry = STYLES[i]
    if (entry[0](vdi)) {
      return entry[1]
    }
  }
}

const mapFilter = (collection, iteratee, results = []) => {
  forEach(collection, function () {
    const result = iteratee.apply(this, arguments)
    if (result !== undefined) {
      results.push(result)
    }
  })
  return results
}

// -------------------------------------------------------------------

execPromise(async args => {
  if (args.length === 0 || args[0] === '-h' || args[0] === '--help') {
    return `Usage: xapi-explore-sr [--full] <SR UUID> <Host URL> <Host user> [<Host password>]`
  }

  const full = args[0] === '--full'
  if (full) {
    args.shift()
  }

  const [
    srUuid = required('SR UUID'),
    url = required('Host URL'),
    user = required('Host user'),
    password = await askPassword('Host password'),
    httpProxy = firstDefined(process.env.http_proxy, process.env.HTTP_PROXY),
  ] = args

  const xapi = createClient({
    allowUnauthorized: true,
    auth: { user, password },
    httpProxy,
    readOnly: true,
    url,
    watchEvents: false,
  })
  await xapi.connect()

  const srRef = await xapi.call('SR.get_by_uuid', srUuid)
  const sr = await xapi.call('SR.get_record', srRef)

  const vdisByRef = {}
  await Promise.all(
    map(sr.VDIs, async ref => {
      const vdi = await xapi.call('VDI.get_record', ref)
      vdisByRef[ref] = vdi
    })
  )

  const hasParents = {}
  const vhdChildrenByUuid = {}
  forEach(vdisByRef, vdi => {
    const vhdParent = vdi.sm_config['vhd-parent']
    if (vhdParent) {
      ;(vhdChildrenByUuid[vhdParent] || (vhdChildrenByUuid[vhdParent] = [])).push(vdi)
    } else if (!(vdi.snapshot_of in vdisByRef)) {
      return
    }

    hasParents[vdi.uuid] = true
  })

  const makeVdiNode = vdi => {
    const { uuid } = vdi

    let label = `${vdi.name_label} - ${uuid} - ${formatSize(+vdi.physical_utilisation)}`
    const nodes = []

    const vhdChildren = vhdChildrenByUuid[uuid]
    if (vhdChildren) {
      mapFilter(orderBy(vhdChildren, 'is_a_snapshot', 'desc'), makeVdiNode, nodes)
    }

    mapFilter(
      vdi.snapshots,
      ref => {
        const vdi = vdisByRef[ref]
        if (full || !vdi.sm_config['vhd-parent']) {
          return makeVdiNode(vdi)
        }
      },
      nodes
    )

    const style = getStyle(vdi)
    if (style) {
      label = style(label)
    }

    return { label, nodes }
  }

  const nodes = mapFilter(orderBy(vdisByRef, ['name_label', 'uuid']), vdi => {
    if (!hasParents[vdi.uuid]) {
      return makeVdiNode(vdi)
    }
  })

  return archy({
    label: `${sr.name_label} (${sr.VDIs.length} VDIs)`,
    nodes,
  })
})
