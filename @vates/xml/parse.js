'use strict'

const sax = require('sax')

exports.parseXml = function parseXml(xml, { normalize = true, strict = true, trim = true } = {}) {
  const stack = [{ children: [] }]

  const parser = sax.parser(strict, { normalize, trim })
  parser.ontext = text => {
    stack[stack.length - 1].children.push(text)
  }
  parser.onopentag = ({ name, attributes }) => {
    stack.push({ name, attributes, children: [] })
  }
  parser.onclosetag = () => {
    const node = stack.pop()
    stack[stack.length - 1].children.push(node)
  }

  parser.write(xml).close()

  return stack[0].children[0]
}
