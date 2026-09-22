import { noSuchObject } from 'xo-common/api-errors.js'

/** @typedef {import('@vates/types').XoApp} XoApp */

/**
 * @typedef {object} Job
 * @property {string} [id]
 * @property {string} [method]
 * @property {string} [type]
 * @property {string} [userId]
 * @property {string} [createdBy]
 * @property {string} [updatedBy]
 */

/**
 * @param {Pick<XoApp, 'getUser'>} app
 * @param {Job | undefined} job
 * @returns {Promise<void>}
 */
export default async function validateJobUser(app, job) {
  if (!job || job.type !== 'call' || job.method !== 'schedule.runSequence') {
    return
  }

  try {
    await app.getUser(job.userId)
  } catch (error) {
    if (noSuchObject.is(error, { id: job.userId, type: 'user' })) {
      error.message = `no such user ${job.userId} for sequence ${job.id}, it might have been deleted. Please save the sequence with another user to update it`
    }
    throw error
  }
}
