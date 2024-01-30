// from package xml-escape
function escape(string) {
  if (string === null || string === undefined) return
  if (typeof string === 'number') {
    return string
  }
  const map = {
    '>': '&gt;',
    '<': '&lt;',
    "'": '&apos;',
    '"': '&quot;',
    '&': '&amp;',
  }

  const pattern = '([&"<>\'])'
  return string.replace(new RegExp(pattern, 'g'), function (str, item) {
    return map[item]
  })
}

function formatDate(d) {
  return d.toISOString().replaceAll('-', '').replace('.000Z', 'Z')
}

export default function toOvaXml(obj) {
  if (Array.isArray(obj)) {
    return `<value><array><data>${obj.map(val => toOvaXml(val)).join('')}</data></array></value>`
  }

  if (typeof obj === 'object') {
    if (obj instanceof Date) {
      return `<value><dateTime.iso8601>${escape(formatDate(obj))}</dateTime.iso8601></value>`
    }
    return `<value><struct>${Object.entries(obj)
      .map(([key, value]) => `<member><name>${escape(key)}</name>${toOvaXml(value)}</member>`)
      .join('')}</struct></value>`
  }
  if (typeof obj === 'boolean') {
    return `<value><boolean>${obj ? 1 : 0}</boolean></value>`
  }
  return `<value>${escape(obj)}</value>`
}
