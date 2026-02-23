import { parse, Property as PropertyNode, StringNode, NumberOrStringNode, type Node } from 'complex-matcher'

interface PropertyPathResult {
  propertyPath: string
  terminalValue: string | undefined
}

/**
 * Extracts the property path and terminal value from a parsed Complex Matcher node.
 * Traverses nested Property nodes to build the full path (e.g., "boot:firmware")
 * and returns the terminal string value if present.
 */
function extractPropertyPathAndValue(node: Node): PropertyPathResult {
  const propertyNames: string[] = []
  let currentNode: Node = node

  // Traverse nested Property nodes to accumulate the full path
  while (currentNode instanceof PropertyNode) {
    propertyNames.push(currentNode.name)
    currentNode = currentNode.child
  }

  const propertyPath = propertyNames.join(':')

  // Check for terminal string value (StringNode or NumberOrStringNode)
  let terminalValue: string | undefined
  if (currentNode instanceof StringNode || currentNode instanceof NumberOrStringNode) {
    terminalValue = currentNode.value
  }

  return { propertyPath, terminalValue }
}

/**
 * Normalizes a boolean filter expression to Complex Matcher boolean syntax.
 * Converts "prop:true" to "prop?" and "prop:false" to "!prop?".
 * Returns the original expression if it's not a boolean expression or if parsing fails.
 */
export function normalizeBooleanExpression(expression: string): string {
  try {
    const parsed = parse(expression)
    const { propertyPath, terminalValue } = extractPropertyPathAndValue(parsed)

    if (propertyPath === '' || terminalValue === undefined) {
      return expression
    }

    const normalizedValue = terminalValue.trim().toLowerCase()

    if (normalizedValue === 'true') {
      return `${propertyPath}?`
    }

    if (normalizedValue === 'false') {
      return `!${propertyPath}?`
    }

    return expression
  } catch {
    // If parsing fails, return the original expression
    return expression
  }
}
