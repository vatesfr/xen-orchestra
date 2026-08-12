// @ts-check

import moment from 'moment-timezone'
import { parse } from 'xo-remote-parser'

/**
 * @typedef {import('@vates/types/xen-api').XenApiVm} XenApiVm
 * @typedef {import('@vates/types/xo').XoSr} XoSr
 * @typedef {import('@vates/types/xo').XoBackupRepository} XoBackupRepository
 *
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
 * @typedef {object} BackupRepositoryContext
 * @property {object} backupRepository
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
 * @param {XenApiVm} vm
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
 * @param {XoSr} sr
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
 * @param {XoBackupRepository} backupRepository
 * @param {RunContext} run
 * @returns {BackupRepositoryContext}
 */
export function buildBackupRepositoryContext(backupRepository, run) {
  return {
    backupRepository: {
      name: backupRepository.name,
      type: parse(backupRepository.url).type,
      tags: [], // Placeholder - Backup repositories don't have tags yet
    },
    run,
  }
}
