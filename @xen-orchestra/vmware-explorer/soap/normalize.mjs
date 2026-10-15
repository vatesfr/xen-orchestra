/**
 * The SOAP library returns a single element as the element itself, and a repeated one as an array.
 *
 * @param {unknown} value
 * @returns {Array<unknown>} - an empty array when the element is absent
 */
export function asArray(value) {
  if (value === undefined || value === null) {
    return []
  }
  return Array.isArray(value) ? value : [value]
}

/**
 * Unwraps a value returned by the SOAP library.
 *
 * A value carrying attributes is wrapped: a scalar becomes `{ $value, attributes }` and a complex
 * type gets an extra `attributes` property. Both are noise for the callers, which only care about
 * the value itself.
 *
 * The normalization is intentionally shallow: the library only wraps the elements which do carry
 * attributes, so nested scalars are already plain values.
 *
 * @param {unknown} value
 * @returns {unknown}
 */
export function normalizeSoapValue(value) {
  if (value === null || typeof value !== 'object') {
    return value
  }
  // a falsy scalar ( '', 0, false ) is still a value
  if ('$value' in value) {
    return value.$value
  }
  if ('attributes' in value) {
    const { attributes, ...rest } = value
    return rest
  }
  return value
}
