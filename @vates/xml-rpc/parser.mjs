const ensureArray = val => (val === undefined ? [] : Array.isArray(val) ? val : [val])

export class Parser {
  array(node) {
    return ensureArray(node.data.value).map(this.value, this)
  }

  base64(str) {
    return Buffer.from(str, 'base64')
  }

  boolean(str) {
    return Boolean(Number(str))
  }

  'dateTime.iso8601'(str) {
    const date = new Date(str)

    // date successfully parsed
    if (!Number.isNaN(+date)) {
      return date
    }

    // XML-RPC dates may use YYYYMMDD instead of YYYY-MM-DD which ECMAScript
    // does not parse
    return new Date(str.slice(0, 4) + '-' + str.slice(4, 6) + '-' + str.slice(6))
  }

  double(str) {
    return Number(str)
  }

  fault(node) {
    return this.value(node.value)
  }

  i4(str) {
    return Number(str)
  }

  int(str) {
    return Number(str)
  }

  member(node) {
    return [node.name, this.value(node.value)]
  }

  methodCall(node) {
    return {
      name: node.methodName,
      params: this.params(node.params),
    }
  }

  methodResponse(node) {
    const { fault } = node
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
    // can be a plain string
    if (typeof node === 'string') {
      return node
    }

    const types = Object.keys(node)
    const type = types[0]
    return this[type](node[type])
  }
}

export const parser = new Parser()
