'use strict'

const { describe, it, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const { createLogger } = require('@xen-orchestra/log')
const { configure } = require('@xen-orchestra/log/configure')
const { captureLogs } = require('@xen-orchestra/log/capture')
const { createCaptureTransport } = require('@xen-orchestra/log/capture')
const { dedupe } = require('@xen-orchestra/log/dedupe')

describe('capture log', () => {
  const logger = createLogger('test-logger')

  const logsTransportDefault = []
  const transportTest = message => {
    logsTransportDefault.push(message)
  }

  const logsTransportFatal = []
  const transportFatal = message => {
    logsTransportFatal.push(message)
  }

  beforeEach(() => {
    configure(
      createCaptureTransport([
        {
          level: 'fatal',
          transport: transportFatal,
        },
        {
          level: 'debug',
          transport: transportTest,
        },
      ])
    )

    logsTransportDefault.length = 0
    logsTransportFatal.length = 0
  })

  it('should log test with all its attributes', () => {
    const expected1 = {
      level: 20,
      namespace: 'test-logger',
      message: 'test 1 with all its attributes',
      time: new Date(),
    }
    logger.debug(expected1.message)
    assert.equal(logsTransportDefault[0]?.message, expected1.message)
    assert.equal(typeof logsTransportDefault[0]?.level, 'number', `level attribute should exist`)
    assert.ok(typeof logsTransportDefault[0]?.namespace === 'string', `namespace attribute should exist`)
    assert.ok(logsTransportDefault[0]?.time instanceof Date, `time attribute should exist`)
  })
  it('should log test 1 and 2', () => {
    const expected1 = {
      level: 20,
      namespace: 'test-logger',
      message: 'should log test 1/2',
      time: new Date(),
    }
    const expected2 = {
      level: 20,
      namespace: 'test-logger',
      message: 'should log test 2/2',
      time: new Date(),
    }
    logger.debug(expected1.message)
    logger.debug(expected2.message)
    assert.equal(logsTransportDefault[0].message, expected1.message)
    assert.equal(logsTransportDefault[1].message, expected2.message)
  })
  it('should log tests for debug', () => {
    const expectedDebug = {
      data: undefined,
      level: 20,
      namespace: 'test-logger',
      message: 'synchronous log debug',
      time: new Date(),
    }
    logger.debug(expectedDebug.message)
    assert.deepEqual(logsTransportDefault[0].message, expectedDebug.message)
    assert.deepEqual(logsTransportDefault[0].level, expectedDebug.level)
  })
  it('should log tests for info', () => {
    const expectedInfo = {
      data: undefined,
      level: 30,
      namespace: 'test-logger',
      message: 'synchronous log info',
      time: new Date(),
    }
    logger.info(expectedInfo.message)
    assert.deepEqual(logsTransportDefault[0].message, expectedInfo.message)
    assert.deepEqual(logsTransportDefault[0].level, expectedInfo.level)
  })
  it('should log tests for warn', () => {
    const expectedWarn = {
      data: undefined,
      level: 40,
      namespace: 'test-logger',
      message: 'synchronous log warn',
      time: new Date(),
    }
    logger.warn(expectedWarn.message)
    assert.deepEqual(logsTransportDefault[0].message, expectedWarn.message)
    assert.deepEqual(logsTransportDefault[0].level, expectedWarn.level)
  })
  it('should log tests for error', () => {
    const expectedError = {
      data: undefined,
      level: 50,
      namespace: 'test-logger',
      message: 'synchronous log error',
      time: new Date(),
    }
    logger.error(expectedError.message)
    assert.deepEqual(logsTransportDefault[0].message, expectedError.message)
    assert.deepEqual(logsTransportDefault[0].level, expectedError.level)
    assert.ok(logsTransportFatal.length === 0, 'fatal logs should be empty')
  })
  it('should log tests for fatal', () => {
    const expectedFatal = {
      data: undefined,
      level: 60,
      namespace: 'test-logger',
      message: 'synchronous log fatal',
      time: new Date(),
    }
    logger.fatal(expectedFatal.message)
    assert.deepEqual(logsTransportFatal[0].message, expectedFatal.message)
    assert.deepEqual(logsTransportFatal[0].level, expectedFatal.level)
  })
  it('should log an error on null', () => {
    const expected1 = {
      data: { level: 20, value: null },
      level: 40,
      namespace: 'test-logger',
      message: 'incorrect value passed to logger',
      time: new Date(),
    }
    logger.debug(null)
    assert.deepEqual(logsTransportDefault[0].data, expected1.data)
  })
  it('should log an error on undefined', () => {
    const expected1 = {
      data: { level: 20, value: undefined },
      level: 40,
      namespace: 'test-logger',
      message: 'incorrect value passed to logger',
      time: new Date(),
    }
    logger.debug(undefined)
    assert.deepEqual(logsTransportDefault[0].data, expected1.data)
  })
  it('should capture logs', async () => {
    const captureLog = []
    await captureLogs(
      log => {
        // every logs emitted in the async context of `fn` will arrive here
        //
        // do not emit logs in this function or this will create a loop.
        captureLog.push(log)
        // console.log(`[captureLog] ${JSON.stringify(log)}`)
        // console.log(`[captureLog]`, captureLog) // ${JSON.stringify(captureLog)}`)
      },
      async () => {
        logger.debug('synchronous logs are captured')

        setTimeout(() => {
          logger.debug('logs from asynchronous callbacks too')
        }, 50)

        await new Promise(resolve => setTimeout(resolve, 50))

        logger.debug('logs in async functions or promise chains too')

        // To escape capture, run code in `captureLogs` with `undefined`
        // as the first param
        captureLogs(undefined, () => {
          logger.debug('this log will not be captured')
        })

        // Returned value and error is forwarded by `captureLogs`
        return 'returned value'
      }
    )

    assert.equal(captureLog[0].message, 'synchronous logs are captured')
    assert.equal(captureLog[1].message, 'logs from asynchronous callbacks too')
    assert.equal(captureLog[2].message, 'logs in async functions or promise chains too')
    assert.ok(captureLog[3] === undefined, 'this log will not be captured')
    assert.equal(logsTransportDefault[0].message, 'this log will not be captured')
  })

  it('should not dedup logs', () => {
    configure(
      createCaptureTransport([
        {
          transport: transportTest,
        },
      ])
    )

    for (let i = 0; i < 3; i++) {
      logger.debug('this line should be logged 3 times')
    }
    assert.equal(logsTransportDefault.length, 3)
  })
  it('should dedup logs', () => {
    configure(
      createCaptureTransport([
        dedupe({
          timeout: 50, // without a defined timeout, the test will wait for 10 minutes
          transport: transportTest,
        }),
      ])
    )

    for (let i = 0; i < 3; i++) {
      logger.debug('this line should be logged only once')
    }
    assert.equal(logsTransportDefault.length, 1)
  })
})
