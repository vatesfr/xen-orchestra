import { parse } from 'complex-matcher'
import type { Property as PropertyNode } from 'complex-matcher'

/**
 * Checks if a value looks like a filter expression (e.g., a property path like "boot:firmware:uefi")
 * rather than a literal string to match.
 *
 * Returns true if:
 * - The value can be parsed by complex-matcher
 * - The parsed result is a PropertyNode (indicating a property path)
 * - Contains at least one colon suggesting property nesting
 */
export function isFilterExpression(value: string): boolean {
  if (!value.includes(':')) {
    return false
  }

  try {
    const parsed = parse(value)
    // Check if it parses as a PropertyNode, which indicates it's a property path
    // PropertyNode instances have a 'name' property and potentially a 'child'
    return parsed != null && 'name' in parsed && typeof (parsed as PropertyNode).name === 'string'
  } catch {
    return false
  }
}
