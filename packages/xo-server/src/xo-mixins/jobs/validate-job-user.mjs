import { noSuchObject } from 'xo-common/api-errors.js'

/** @typedef {import('@vates/types').XoApp} XoApp */
/** @typedef {import('@vates/types').XoJob} XoJob */

/**
 * @param {Pick<XoApp, 'getUser' | 'isJobSequence'>} app
 * @param {XoJob} job
 * @returns {Promise<void>}
 */
export default async function validateJobUser(app, job) {
  if (!app.isJobSequence(job)) {
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
