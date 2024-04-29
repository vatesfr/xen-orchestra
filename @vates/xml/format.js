'use strict'

const ENTITIES = {
  '"': '&quot;',
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  "'": '&apos;',
}
const RE = new RegExp(Object.keys(ENTITIES).join('|'), 'g')
function replace(match) {
  return ENTITIES[match]
}
function escape(str) {
  return str.replace(RE, replace)
}

function formatNode(node, depth) {
  const indent = this.indent.repeat(depth)

  if (typeof node === 'object') {
    const line = [indent, '<', node.name]
    const { attributes } = node
    if (attributes !== undefined) {
      for (const name of Object.keys(attributes)) {
        line.push(' ', name, '="', escape(attributes[name]), '"')
      }
    }

    const { children } = node
    if (children === undefined || children.length === 0) {
      line.push(' />')
      this.lines.push(line.join(''))
    } else {
      line.push('>')
      this.lines.push(line.join(''))

      for (const child of children) {
        formatNode.call(this, child, depth + 1)
      }

      this.lines.push(indent + '</' + node.name + '>')
    }
  } else {
    // string (or scalar)
    this.lines.push(indent + escape(String(node)))
  }
}

exports.formatXml = function formatXml(tree, { includeDeclaration = true, indent = 2 } = {}) {
  const lines = []

  if (includeDeclaration) {
    lines.push('<?xml version="1.0" encoding="UTF-8"?>')
  }

  const ctx = {
    lines,
    indent: typeof indent === 'number' ? ' '.repeat(indent) : indent,
  }
  formatNode.call(ctx, tree, 0)

  return lines.join(indent !== 0 && indent !== '' ? '\n' : '')
}
