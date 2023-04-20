'use strict'

const { BaseError } = require('make-error')
const iteratee = require('lodash/iteratee.js')

class XoError extends BaseError {
  constructor({ code, message, data }) {
    super(message)
    this.code = code
    this.data = data
  }

  toJsonRpcError() {
    return {
      message: this.message,
      code: this.code,
      data: this.data,
    }
  }
}

const create = (code, getProps) => {
  const factory = (...args) => {
    const props = getProps(...args)
    props.code = code
    throw new XoError(props)
  }
  factory.is = (error, predicate) => error.code === code && (predicate === undefined || iteratee(predicate)(error.data))

  return factory
}

// =============================================================================

exports.notImplemented = create(0, () => ({
  message: 'not implemented',
}))

exports.noSuchObject = create(1, (id, type) => ({
  data: { id, type },
  message: `no such ${type || 'object'} ${id}`,
}))

exports.unauthorized = create(2, (permission, objectId, objectType) => ({
  data: {
    permission,
    object: {
      id: objectId,
      type: objectType,
    },
  },
  message: 'not enough permissions',
}))

exports.invalidCredentials = create(3, () => ({
  message: 'invalid credentials',
}))

// Deprecated alreadyAuthenticated (4)

exports.forbiddenOperation = create(5, (operation, reason) => ({
  data: { operation, reason },
  message: `forbidden operation: ${operation}`,
}))

// Deprecated GenericError (6)

exports.noHostsAvailable = create(7, () => ({
  message: 'no hosts available',
}))

exports.authenticationFailed = create(8, () => ({
  message: 'authentication failed',
}))

exports.serverUnreachable = create(9, objectId => ({
  data: {
    objectId,
  },
  message: 'server unreachable',
}))

exports.invalidParameters = create(10, (message, errors) => {
  if (Array.isArray(message)) {
    errors = message
    message = undefined
  }

  return {
    data: { errors },
    message: message || 'invalid parameters',
  }
})

exports.vmMissingPvDrivers = create(11, ({ vm }) => ({
  data: {
    objectId: vm,
  },
  message: 'missing PV drivers',
}))

exports.vmIsTemplate = create(12, ({ vm }) => ({
  data: {
    objectId: vm,
  },
  message: 'VM is a template',
}))

exports.vmBadPowerState = create(13, ({ vm, expected, actual }) => ({
  data: {
    objectId: vm,
    expected,
    actual,
  },
  message: `VM state is ${actual} but should be ${expected}`,
}))

exports.vmLacksFeature = create(14, ({ vm, feature }) => ({
  data: {
    objectId: vm,
    feature,
  },
  message: `VM lacks feature ${feature || ''}`,
}))

exports.notSupportedDuringUpgrade = create(15, () => ({
  message: 'not supported during upgrade',
}))

exports.objectAlreadyExists = create(16, ({ objectId, objectType }) => ({
  data: {
    objectId,
    objectType,
  },
  message: `${objectType || 'object'} already exists`,
}))

exports.vdiInUse = create(17, ({ vdi, operation }) => ({
  data: {
    objectId: vdi,
    operation,
  },
  message: 'VDI in use',
}))

exports.hostOffline = create(18, ({ host }) => ({
  data: {
    objectId: host,
  },
  message: 'host offline',
}))

exports.operationBlocked = create(19, ({ objectId, code }) => ({
  data: {
    objectId,
    code,
  },
  message: 'operation blocked',
}))

exports.patchPrecheckFailed = create(20, ({ errorType, patch }) => ({
  data: {
    objectId: patch,
    errorType,
  },
  message: `patch precheck failed: ${errorType}`,
}))

exports.operationFailed = create(21, ({ objectId, code }) => ({
  data: {
    objectId,
    code,
  },
  message: 'operation failed',
}))

exports.missingAuditRecord = create(22, ({ id, nValid }) => ({
  data: {
    id,
    nValid,
  },
  message: 'missing record',
}))

exports.alteredAuditRecord = create(23, ({ id, record, nValid }) => ({
  data: {
    id,
    record,
    nValid,
  },
  message: 'altered record',
}))

exports.notEnoughResources = create(24, data => ({
  data, // [{ resourceSet, resourceType, available, requested }]
  message: 'not enough resources in resource set',
}))

exports.incorrectState = create(25, ({ actual, expected, object, property }) => ({
  data: {
    actual,
    expected,
    object,
    property,
  },
  message: 'incorrect state',
}))

exports.featureUnauthorized = create(26, ({ featureCode, currentPlan, minPlan }) => ({
  data: {
    featureCode,
    currentPlan,
    minPlan,
  },
  message: 'feature Unauthorized',
}))
