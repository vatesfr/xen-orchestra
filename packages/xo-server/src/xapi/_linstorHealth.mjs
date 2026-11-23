import { setTimeout } from 'node:timers/promises'
import { timeout as pTimeout } from 'promise-toolbox'

// Health of LINSTOR (XOSTOR) as seen by a rolling pool update: restarting its
// services or rebooting a host while a volume is not up to date can hang the
// migrations of the next evacuation, or lose the DRBD quorum.
//
// Based on the `healthCheck` function of the `linstor-manager` plugin:
// https://github.com/xcp-ng/sm/blob/3.2.12-8.3/drivers/linstor-manager

// error codes of the plugin: `level << 24 | type << 16 | id`
const ERROR_TYPE_MASK = 0xff0000
const ERROR_TYPE_NODE = 0x20000
const ERROR_TYPE_STORAGE_POOL = 0x30000
const ERROR_TYPE_VOLUME = 0x40000
const GENERIC_LINSTOR_UNREACHABLE = 0x2010001

// Up to sm 3.2.12-25.1, the plugin looks for the volumes at the wrong level of
// its own resources: it fails with this message on every pool with at least one
// resource, before reporting any volume
const BROKEN_PLUGIN_MESSAGE = "'volumes'"

const HEALTHY_DISK_STATES = new Set(['Attached', 'Created', 'TieBreaker', 'UpToDate'])

const MAX_REPORTED_ISSUES = 10

// a health check which hangs, on a controller which does not answer, must not
// block the rolling pool update forever
const HEALTH_CHECK_TIMEOUT = 5 * 60e3

const describeVolume = ({ node, number, resource, state }) =>
  `volume ${number} of resource ${resource} on node ${node} is ${state}`

// Keeps a list of issues short enough to be read in an error or a task log
export function truncateLinstorIssues(issues) {
  const reported = issues.slice(0, MAX_REPORTED_ISSUES)
  if (issues.length > reported.length) {
    reported.push(`and ${issues.length - reported.length} more`)
  }
  return reported
}

// What prevents the services of LINSTOR from being restarted, or a host from
// being rebooted, in the result of a health check of the plugin
//
// The capacity of the storage pools is not part of it: it does not change what a
// reboot does
export function getLinstorBlockingIssues({ errors = [], resources = {} }) {
  // the state of the volumes is read from the resources rather than from the
  // errors of the plugin, which a broken plugin does not report. It is only
  // possible when the plugin lists its resources by node
  const resourceList = Object.entries(resources)
  const listedByNode = resourceList.length > 0 && resourceList.every(([, resource]) => resource.nodes !== undefined)

  const issues = []
  for (const error of errors) {
    const type = error.code & ERROR_TYPE_MASK
    if (type === ERROR_TYPE_STORAGE_POOL) {
      continue
    }
    if (type === ERROR_TYPE_NODE) {
      issues.push(`node ${error.name} is ${error.status}`)
    } else if (type === ERROR_TYPE_VOLUME) {
      if (!listedByNode) {
        issues.push(describeVolume(error))
      }
    } else if (error.code === GENERIC_LINSTOR_UNREACHABLE) {
      issues.push(`LINSTOR controller unreachable: ${error.message}`)
    } else if (!(listedByNode && error.message === BROKEN_PLUGIN_MESSAGE)) {
      issues.push(`LINSTOR health check failed: ${error.message}`)
    }
  }

  if (listedByNode) {
    for (const [resource, { nodes }] of resourceList) {
      for (const [node, { diskful, volumes = [] }] of Object.entries(nodes)) {
        for (const volume of volumes) {
          const state = volume['disk-state'] ?? 'unknown'
          if (!HEALTHY_DISK_STATES.has(state) && !(state === 'Diskless' && !diskful)) {
            issues.push(describeVolume({ node, number: volume.number, resource, state }))
          }
        }
      }
    }
  }

  return issues
}

// Checks every LINSTOR storage of the pool once. A failure of the plugin itself
// is thrown, as is a check which does not answer in HEALTH_CHECK_TIMEOUT
export async function getLinstorIssues(xapi) {
  const groupNames = new Set()
  for (const sr of Object.values(xapi.objects.indexes.type.SR)) {
    // a storage without PBD is attached to no host: nothing to check
    if (sr.type === 'linstor' && sr.$PBDs.length > 0) {
      groupNames.add(sr.$PBDs[0].device_config['group-name'])
    }
  }

  const issues = []
  for (const groupName of groupNames) {
    const result = await pTimeout.call(
      xapi.call('host.call_plugin', xapi.pool.master, 'linstor-manager', 'healthCheck', { groupName }),
      HEALTH_CHECK_TIMEOUT,
      () => {
        throw new Error(
          `LINSTOR health check of group ${groupName} did not answer in ${HEALTH_CHECK_TIMEOUT / 1e3} seconds`
        )
      }
    )
    issues.push(...getLinstorBlockingIssues(JSON.parse(result)))
  }
  return issues
}

// Waits for LINSTOR to have no blocking issue: its controller comes back, and
// its volumes resynchronize, on their own after a restart of its services or
// the reboot of a host
//
// A plugin without health check cannot tell, and an answer which is not JSON
// cannot be read: those errors are thrown as is
export async function waitLinstorHealthy(xapi, { timeout, interval = 5e3 }) {
  const deadline = Date.now() + timeout
  while (true) {
    let cause, issues
    try {
      // a call to the plugin which hangs must not outlast the deadline: it is
      // given what is left of it, and counts as a failed check past that
      issues = await pTimeout.call(getLinstorIssues(xapi), Math.max(deadline - Date.now(), 1))
    } catch (error) {
      // waiting does not help a plugin too old to check, nor an answer which
      // is not JSON
      if (error.code === 'UNKNOWN_XENAPI_PLUGIN_FUNCTION' || error instanceof SyntaxError) {
        throw error
      }
      // the call to the plugin fails or hangs while the controller is not
      // started yet. The plugin is the one which finds the controller: only the
      // host it ran on, the master, can be named
      cause = error
      issues = [`LINSTOR health check failed on host ${xapi.pool.$master.name_label}: ${error.message}`]
    }
    if (issues.length === 0) {
      return
    }
    if (Date.now() + interval > deadline) {
      throw new Error(
        `LINSTOR is not healthy after ${Math.round(timeout / 1e3)} seconds: ${truncateLinstorIssues(issues).join('; ')}`,
        { cause }
      )
    }
    await setTimeout(interval)
  }
}
