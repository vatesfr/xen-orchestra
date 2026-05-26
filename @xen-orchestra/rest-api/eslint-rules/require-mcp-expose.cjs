'use strict'

/**
 * Require `@Extension('x-mcp-exposure', 'allow' | 'confirm' | 'deny')` next to
 * every `@Get/@Post/@Put/@Patch/@Delete` method. tsoa detects extension
 * decorators by AST identifier name, so the `Extension` literal must appear in
 * source — a `@McpExpose` wrapper would not be picked up.
 *
 * Scope: this is a SURFACE-CONTROL policy, not a security control. The value
 * only decides which endpoints the official `@xen-orchestra/mcp` server turns
 * into LLM tools; the REST API itself never reads `x-mcp-exposure`. Every
 * endpoint stays gated by its own RBAC/ACL middleware regardless of this
 * annotation, and any REST client with valid credentials (including a
 * non-official MCP) can still call a `'deny'`-tagged endpoint directly. The
 * rule only guarantees the exposure decision is made explicitly per endpoint —
 * it does not harden the REST API.
 */

const HTTP_METHOD_DECORATORS = new Set(['Get', 'Post', 'Put', 'Patch', 'Delete'])
const MCP_EXPOSURE_KEY = 'x-mcp-exposure'
const VALID_EXPOSURES = new Set(['allow', 'confirm', 'deny'])

function getDecoratorCalleeName(decorator) {
  const expr = decorator.expression
  if (!expr) return undefined
  if (expr.type === 'CallExpression' && expr.callee && expr.callee.type === 'Identifier') {
    return expr.callee.name
  }
  if (expr.type === 'Identifier') {
    return expr.name
  }
  return undefined
}

function findHttpMethodDecorator(decorators) {
  for (const decorator of decorators) {
    const name = getDecoratorCalleeName(decorator)
    if (name !== undefined && HTTP_METHOD_DECORATORS.has(name)) {
      return { decorator, name }
    }
  }
  return undefined
}

function getStringLiteralValue(node) {
  if (!node) return undefined
  if (node.type === 'Literal' && typeof node.value === 'string') return node.value
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0 && node.quasis.length === 1) {
    return node.quasis[0].value.cooked
  }
  return undefined
}

function findMcpExposureExtension(decorators) {
  for (const decorator of decorators) {
    if (!decorator.expression || decorator.expression.type !== 'CallExpression') continue
    const callee = decorator.expression.callee
    if (!callee || callee.type !== 'Identifier' || callee.name !== 'Extension') continue

    const [keyArg, valueArg] = decorator.expression.arguments
    const key = getStringLiteralValue(keyArg)
    if (key !== MCP_EXPOSURE_KEY) continue

    return { decorator, valueArg }
  }
  return undefined
}

function getMethodName(methodNode) {
  if (!methodNode.key) return '<anonymous>'
  if (methodNode.key.type === 'Identifier') return methodNode.key.name
  if (methodNode.key.type === 'Literal') return String(methodNode.key.value)
  return '<computed>'
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Every REST endpoint must declare its MCP exposure with @Extension("x-mcp-exposure", "allow" | "confirm" | "deny").',
    },
    schema: [],
    messages: {
      missingMcpExpose:
        'Endpoint "{{name}}" decorated with @{{httpMethod}} is missing an @Extension("x-mcp-exposure", ...) decorator. ' +
        'Add @Extension("x-mcp-exposure", "allow"), "confirm", or "deny" to make the MCP exposure decision explicit.',
      invalidMcpExpose:
        'Endpoint "{{name}}" has @Extension("x-mcp-exposure", ...) with an invalid value. ' +
        'Expected one of: "allow", "confirm", "deny". Got: {{got}}.',
    },
  },
  create(context) {
    return {
      MethodDefinition(node) {
        if (node.kind === 'constructor') return
        const decorators = node.decorators
        if (!decorators || decorators.length === 0) return

        const httpMethod = findHttpMethodDecorator(decorators)
        if (!httpMethod) return

        const methodName = getMethodName(node)
        const mcpExposure = findMcpExposureExtension(decorators)

        if (!mcpExposure) {
          context.report({
            node,
            messageId: 'missingMcpExpose',
            data: { name: methodName, httpMethod: httpMethod.name },
          })
          return
        }

        const exposureValue = getStringLiteralValue(mcpExposure.valueArg)
        if (exposureValue === undefined || !VALID_EXPOSURES.has(exposureValue)) {
          context.report({
            node: mcpExposure.valueArg ?? mcpExposure.decorator,
            messageId: 'invalidMcpExpose',
            data: {
              name: methodName,
              got: exposureValue === undefined ? '<non-literal>' : JSON.stringify(exposureValue),
            },
          })
        }
      },
    }
  },
}
