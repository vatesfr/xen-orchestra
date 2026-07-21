// @ts-check

import moment from 'moment-timezone'
import { parse } from 'xo-remote-parser'

/**
 * @typedef {object} RunContext
 * @property {number} dayOfWeek
 * @property {number} dayOfMonth
 * @property {number} hour
 * @property {number} month
 * @property {number} year
 *
 * @typedef {object} VmContext
 * @property {object} vm
 * @property {RunContext} run
 * @property {number} [chainLength]
 *
 * @typedef {object} SrContext
 * @property {object} sr
 * @property {RunContext} run
 *
 * @typedef {object} RemoteContext
 * @property {object} remote
 * @property {RunContext} run
 */

/**
 * @param {Date} date
 * @param {string | undefined} timezone
 * @returns {RunContext}
 */
export function buildRunContext(date, timezone) {
  const momentDate = timezone ? moment.tz(date, timezone) : moment(date)
  return {
    dayOfWeek: momentDate.day(),
    dayOfMonth: momentDate.date(),
    hour: momentDate.hour(),
    month: momentDate.month() + 1,
    year: momentDate.year(),
  }
}

/**
 * @param {object} vm
 * @param {RunContext} run
 * @param {number} [chainLength]
 * @returns {VmContext}
 */
export function buildVmContext(vm, run, chainLength) {
  /** @type {Record<string, any>} */
  const vmObject = {}
  for (const [key, value] of Object.entries(vm)) {
    if (!key.startsWith('$') && typeof value !== 'function') {
      vmObject[key] = value
    }
  }

  if (!Array.isArray(vmObject.tags)) {
    vmObject.tags = []
  }

  return { vm: vmObject, run, chainLength }
}

/**
 * @param {Record<string, any>} sr
 * @param {RunContext} run
 * @returns {SrContext}
 */
export function buildSrContext(sr, run) {
  return {
    sr: {
      name_label: sr.name_label,
      type: sr.SR_type,
      description: sr.name_description,
      tags: Array.isArray(sr.tags) ? sr.tags : [],
    },
    run,
  }
}

/**
 * @param {Record<string, any>} remote
 * @param {RunContext} run
 * @returns {RemoteContext}
 */
export function buildRemoteContext(remote, run) {
  return {
    remote: {
      name: remote.name,
      type: parse(remote.url).type,
      tags: Array.isArray(remote.tags) ? remote.tags : [],
    },
    run,
  }
}
