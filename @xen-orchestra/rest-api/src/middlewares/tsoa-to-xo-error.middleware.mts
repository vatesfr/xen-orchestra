import { invalidParameters } from 'xo-common/api-errors.js'
import { NextFunction, Request, Response } from 'express'
import { FieldErrors, ValidateError } from 'tsoa'

export default function tsoaToXoErrorHandler(error: unknown, _req: Request, _res: Response, next: NextFunction) {
  if (error instanceof ValidateError) {
    const fields = simplifyUnionValidationErrors(error.fields)
    throw invalidParameters(fields)
  }

  return next(error)
}

function simplifyUnionValidationErrors(fields: Record<string, any>) {
  const result: Record<string, any> = {}

  for (const [key, field] of Object.entries(fields)) {
    if (isUnionMismatchError(field)) {
      result[key] = {
        ...field,
        message: 'Value does not match any allowed schema',
      }
      continue
    }

    result[key] = field
  }

  return result
}

function isUnionMismatchError(field: FieldErrors[string]) {
  if (typeof field !== 'object' || field === null || !('message' in field)) {
    return false
  }

  return (
    typeof field.message === 'string' && field.message.startsWith('Could not match the union against any of the items')
  )
}
