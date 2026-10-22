import { isExpression, compileExpression } from '@xen-orchestra/backups/_expressionPredicate.mjs'
import { invalidParameters } from 'xo-common/api-errors.js'

export function assertValidSettingsExpression(settings, keys) {
  for (const [scheduleId, scheduleSettings] of Object.entries(settings ?? {})) {
    for (const key of keys) {
      assertValidExpression(`settings/${scheduleId}/${key}`, scheduleSettings?.[key])
    }
  }
}

export function assertValidExpression(name, value) {
  if (isExpression(value)) {
    try {
      compileExpression(value)
    } catch (error) {
      throw invalidParameters(`Invalid ${name} expression: ${error.message}`, [
        { instancePath: `/${name}`, message: error.message },
      ])
    }
  }
}
