'use strict'

function toValue(node) {
  const obj = { __proto__: null }
  for (const child of node.children) {
    if (typeof child === 'string') {
      return child
    }

    const { name } = child
    if (Object.hasOwn(obj, name)) {
      const prev = obj[name]
      if (Array.isArray(obj, name)) {
        prev.push(child)
      } else {
        obj[name] = [prev, child]
      }
    } else {
      obj[name] = child
    }
  }
  return obj
}

// https://en.wikipedia.org/wiki/XML-RPC#Data_types
class XmlRpcParser {
  parse(node) {
    return this['parse_' + node.name](node)
  }

  parse_array({ children: [data] }) {
    return data.children.map(this.parse_value, this)
  }

  parse_base64({ children: [str] }) {
    return Buffer.from(str, 'base64')
  }

  parse_boolean({ children: [str] }) {
    return Boolean(Number(str))
  }

  'parse_dateTime.iso8601'({ children: [str] }) {
    const date = new Date(str)

    // date successfully parsed
    if (!Number.isNaN(+date)) {
      return date
    }

    // XML-RPC dates may use YYYYMMDD instead of YYYY-MM-DD which ECMAScript
    // does not parse
    return new Date(str.slice(0, 4) + '-' + str.slice(4, 6) + '-' + str.slice(6))
  }

  parse_double({ children: [str] }) {
    return Number(str)
  }

  parse_fault({ children: [value] }) {
    return this.parse_value(value)
  }

  parse_i4({ children: [str] }) {
    return Number(str)
  }

  parse_int({ children: [str] }) {
    return Number(str)
  }

  parse_member(member) {
    member = toValue(member)
    return [member.name.children[0], this.parse_value(member.value)]
  }

  parse_methodCall(methodCall) {
    methodCall = toValue(methodCall)
    return {
      methodName: methodCall.methodName.children[0],
      params: this.parse_params(methodCall.params),
    }
  }

  parse_methodResponse(methodResponse) {
    methodResponse = toValue(methodResponse)

    const { fault } = methodResponse
    if (fault !== undefined) {
      return { fault: this.parse_fault(fault) }
    }

    return { params: this.parse_params(methodResponse.params) }
  }

  parse_nil() {
    return null
  }

  parse_param(param) {
    return this.parse_value(param.children[0])
  }

  parse_params(params) {
    return params.children.map(this.parse_param, this)
  }

  parse_string({ children: [str] }) {
    return str
  }

  parse_struct(struct) {
    return Object.fromEntries(struct.children.map(this.parse_member, this))
  }

  parse_value({ children }) {
    if (children.length === 0) {
      return ''
    }

    const child = children[0]

    // can be a plain string
    if (typeof child === 'string') {
      return child
    }

    return this.parse(child)
  }
}
exports.XmlRpcParser = XmlRpcParser

exports.xmlRpcParser = new XmlRpcParser()
