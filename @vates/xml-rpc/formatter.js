'use strict'

function node(name, attributes, children) {
  if (Array.isArray(attributes)) {
    children = attributes
    attributes = undefined
  }

  return { name, attributes, children }
}

class XmlRpcFormatter {
  format_js(value) {
    const type = typeof value
    if (type === 'object') {
      return value === null
        ? this.format_nil()
        : value instanceof Date
          ? this['format_dateTime.iso8601'](value)
          : Array.isArray(value)
            ? this.format_array(value)
            : Buffer.isBuffer(value)
              ? this.format_base64(value)
              : this.format_struct(value)
    }

    return this['format_' + type](value)
  }

  format_array(values) {
    return node('array', [node('data', values.map(this.format_value, this))])
  }

  format_base64(buf) {
    return node('base64', [buf.toString('base64')])
  }

  format_boolean(bool) {
    return node('boolean', [bool ? '1' : '0'])
  }

  'format_dateTime.iso8601'(date) {
    return node('dateTime.iso8601', [date.toISOString()])
  }

  format_double(str) {
    return node('double', [String(str)])
  }

  format_fault(val) {
    return node('fault', [this.format_value(val)])
  }

  format_i4(str) {
    return node('i4', [String(str)])
  }

  format_int(str) {
    return node('int', [String(str)])
  }

  format_member([name, value]) {
    return node('member', [node('name', [name]), this.format_value(value)])
  }

  format_methodCall({ methodName, params }) {
    return node('methodCall', [node('methodName', [methodName]), this.format_params(params)])
  }

  format_methodResponse({ fault, params }) {
    return node('methodResponse', [fault !== undefined ? this.format_fault(fault) : this.format_params(params)])
  }

  format_nil() {
    return node('nil')
  }

  format_number(num) {
    return Number.isInteger(num) ? this.format_int(num) : this.format_double(num)
  }

  format_param(value) {
    return node('param', [this.format_value(value)])
  }

  format_params(params) {
    return node('params', params.map(this.format_param, this))
  }

  format_string(str) {
    return str
  }

  format_struct(struct) {
    return node('struct', Object.entries(struct).map(this.format_member, this))
  }

  format_value(value) {
    return node('value', [this.format_js(value)])
  }
}
exports.Formatter = XmlRpcFormatter

exports.xmlRpcFormatter = new XmlRpcFormatter()
