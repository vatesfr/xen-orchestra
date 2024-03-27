export class Formatter {
  array(values) {
    return { array: { data: { values: values.map(this.value, this) } } }
  }

  base64(buf) {
    return { base64: buf.toString('base64') }
  }

  boolean(bool) {
    return bool ? '1' : '0'
  }

  'dateTime.iso8601'(date) {
    return date.toISOString()
  }

  double(str) {
    return String(str)
  }

  fault(val) {
    return this.value(val)
  }

  i4(str) {
    return String(str)
  }

  int(str) {
    return String(str)
  }

  member(name, value) {
    return { name, value }
  }

  methodCall(name, params) {
    return {
      name,
      params: this.params(params),
    }
  }

  methodResponse(fault, params) {
    if (fault !== undefined) {
      return { fault: this.fault(fault) }
    }

    return { params: this.params(node.params) }
  }

  nil() {
    return null
  }

  param(node) {
    return this.value(node.value)
  }

  params(node) {
    return ensureArray(node.param).map(this.param, this)
  }

  string(str) {
    return str
  }

  struct(node) {
    return Object.fromEntries(ensureArray(node.member).map(this.member, this))
  }

  value(node) {
    const type = typeof node
    // can be a plain string
    if (typeof node === 'string') {
      return node
    }

    const types = Object.keys(node)
    const type = types[0]
    return this[type](node[type])
  }
}

export const formatter = new Formatter()
