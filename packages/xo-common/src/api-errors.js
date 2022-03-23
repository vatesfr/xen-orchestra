import { BaseError } from 'make-error'
import { iteratee } from 'lodash'

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
  const factory = (...args) => new XoError({ ...getProps(...args), code })
  factory.is = (error, predicate) => error.code === code && (predicate === undefined || iteratee(predicate)(error.data))

  return factory
}

// =============================================================================

export const notImplemented = create(0, () => ({
  message: 'not implemented',
}))

export const noSuchObject = create(1, (id, type) => ({
  data: { id, type },
  message: `no such ${type || 'object'} ${id}`,
}))

export const unauthorized = create(2, (permission, objectId, objectType) => ({
  data: {
    permission,
    object: {
      id: objectId,
      type: objectType,
    },
  },
  message: 'not enough permissions',
}))

export const invalidCredentials = create(3, () => ({
  message: 'invalid credentials',
}))

// Deprecated alreadyAuthenticated (4)

export const forbiddenOperation = create(5, (operation, reason) => ({
  data: { operation, reason },
  message: `forbidden operation: ${operation}`,
}))

// Deprecated GenericError (6)

export const noHostsAvailable = create(7, () => ({
  message: 'no hosts available',
}))

export const authenticationFailed = create(8, () => ({
  message: 'authentication failed',
}))

export const serverUnreachable = create(9, objectId => ({
  data: {
    objectId,
  },
  message: 'server unreachable',
}))

export const invalidParameters = create(10, (message, errors) => {
  if (Array.isArray(message)) {
    errors = message
    message = undefined
  }

  return {
    data: { errors },
    message: message || 'invalid parameters',
  }
})

export const vmMissingPvDrivers = create(11, ({ vm }) => ({
  data: {
    objectId: vm,
  },
  message: 'missing PV drivers',
}))

export const vmIsTemplate = create(12, ({ vm }) => ({
  data: {
    objectId: vm,
  },
  message: 'VM is a template',
}))

export const vmBadPowerState = create(13, ({ vm, expected, actual }) => ({
  data: {
    objectId: vm,
    expected,
    actual,
  },
  message: `VM state is ${actual} but should be ${expected}`,
}))

export const vmLacksFeature = create(14, ({ vm, feature }) => ({
  data: {
    objectId: vm,
    feature,
  },
  message: `VM lacks feature ${feature || ''}`,
}))

export const notSupportedDuringUpgrade = create(15, () => ({
  message: 'not supported during upgrade',
}))

export const objectAlreadyExists = create(16, ({ objectId, objectType }) => ({
  data: {
    objectId,
    objectType,
  },
  message: `${objectType || 'object'} already exists`,
}))

export const vdiInUse = create(17, ({ vdi, operation }) => ({
  data: {
    objectId: vdi,
    operation,
  },
  message: 'VDI in use',
}))

export const hostOffline = create(18, ({ host }) => ({
  data: {
    objectId: host,
  },
  message: 'host offline',
}))

export const operationBlocked = create(19, ({ objectId, code }) => ({
  data: {
    objectId,
    code,
  },
  message: 'operation blocked',
}))

export const patchPrecheckFailed = create(20, ({ errorType, patch }) => ({
  data: {
    objectId: patch,
    errorType,
  },
  message: `patch precheck failed: ${errorType}`,
}))

export const operationFailed = create(21, ({ objectId, code }) => ({
  data: {
    objectId,
    code,
  },
  message: 'operation failed',
}))

export const missingAuditRecord = create(22, ({ id, nValid }) => ({
  data: {
    id,
    nValid,
  },
  message: 'missing record',
}))

export const alteredAuditRecord = create(23, ({ id, record, nValid }) => ({
  data: {
    id,
    record,
    nValid,
  },
  message: 'altered record',
}))

export const notEnoughResources = create(24, data => ({
  data, // [{ resourceSet, resourceType, available, requested }]
  message: 'not enough resources in resource set',
}))

export const incorrectState = create(25, ({ actual, expected, object, property }) => ({
  data: {
    actual,
    expected,
    object,
    property,
  },
  message: 'incorrect state',
}))

export const featureUnauthorized = create(26, ({ featureCode, currentPlan, minPlan }) => ({
  data: {
    featureCode,
    currentPlan,
    minPlan,
  },
  message: 'feature Unauthorized',
}))
