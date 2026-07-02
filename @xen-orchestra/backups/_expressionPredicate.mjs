// @ts-check

import * as CM from 'complex-matcher'

/**
 * Parse and compile a complex-matcher expression into a predicate function.
 * Throws synchronously if the expression is syntactically invalid.
 *
 * @param {string} expression
 * @returns {(context: object) => boolean}
 */
export function compileExpression(expression) {
  return CM.parse(expression).createPredicate()
}

/**
 * Returns true if value is a non-empty string — i.e. a complex-matcher expression.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isExpression(value) {
  return typeof value === 'string' && value.length > 0
}
