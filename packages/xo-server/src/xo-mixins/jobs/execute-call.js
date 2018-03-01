import { createPredicate } from 'value-matcher'
import { timeout } from 'promise-toolbox'
import { assign, filter, find, isEmpty, map, mapValues } from 'lodash'

import { crossProduct } from '../../math'
import { asyncMap, serializeError, thunkToArray } from '../../utils'

// ===================================================================

const paramsVectorActionsMap = {
  extractProperties ({ mapping, value }) {
    return mapValues(mapping, key => value[key])
  },
  crossProduct ({ items }) {
    return thunkToArray(
      crossProduct(map(items, value => resolveParamsVector.call(this, value)))
    )
  },
  fetchObjects ({ pattern }) {
    const objects = filter(this.xo.getObjects(), createPredicate(pattern))
    if (isEmpty(objects)) {
      throw new Error('no objects match this pattern')
    }
    return objects
  },
  map ({ collection, iteratee, paramName = 'value' }) {
    return map(resolveParamsVector.call(this, collection), value => {
      return resolveParamsVector.call(this, {
        ...iteratee,
        [paramName]: value,
      })
    })
  },
  set: ({ values }) => values,
}

export function resolveParamsVector (paramsVector) {
  const visitor = paramsVectorActionsMap[paramsVector.type]
  if (!visitor) {
    throw new Error(`Unsupported function '${paramsVector.type}'.`)
  }

  return visitor.call(this, paramsVector)
}

// ===================================================================

export default async function executeJobCall ({ data, job, runJobId, session }) {
  const { paramsVector } = job
  const paramsFlatVector = paramsVector
    ? resolveParamsVector.call(this, paramsVector)
    : [{}] // One call with no parameters

  const schedule = find(await this.xo.getAllSchedules(), { jobId: job.id })

  const execStatus = {
    calls: {},
    runJobId,
    start: Date.now(),
    timezone: schedule !== undefined ? schedule.timezone : undefined,
  }

  await asyncMap(paramsFlatVector, params => {
    Object.assign(params, data)
    const runCallId = this._logger.notice(
      `Starting ${job.method} call. (${job.id})`,
      {
        event: 'jobCall.start',
        runJobId,
        method: job.method,
        params,
      }
    )

    const call = (execStatus.calls[runCallId] = {
      method: job.method,
      params,
      start: Date.now(),
    })
    let promise = this.xo.callApiMethod(session, job.method, assign({}, params))
    if (job.timeout) {
      promise = promise::timeout(job.timeout)
    }

    return promise.then(
      value => {
        this._logger.notice(
          `Call ${job.method} (${runCallId}) is a success. (${job.id})`,
          {
            event: 'jobCall.end',
            runJobId,
            runCallId,
            returnedValue: value,
          }
        )

        call.returnedValue = value
        call.end = Date.now()
      },
      reason => {
        this._logger.notice(
          `Call ${job.method} (${runCallId}) has failed. (${job.id})`,
          {
            event: 'jobCall.end',
            runJobId,
            runCallId,
            error: serializeError(reason),
          }
        )

        call.error = reason
        call.end = Date.now()
      }
    )
  })

  execStatus.end = Date.now()

  return execStatus
}
