const XML_ENTITIES = {
  '&amp;': '&',
  '&apos;': "'",
  '&gt;': '>',
  '&lt;': '<',
  '&quot;': '"',
}

const unescapeXml = text => text.replace(/&(?:amp|apos|gt|lt|quot);/g, entity => XML_ENTITIES[entity])

// node-soap wraps text nodes either as a plain string or as `{ $value }` depending on
// whether the element carries attributes
const valueOf = node => {
  if (typeof node === 'string') {
    return node
  }
  if (node !== null && typeof node === 'object' && typeof node.$value === 'string') {
    return node.$value
  }
}

const faultTypeOfElementName = name => name.replace(/^.*:/, '').replace(/Fault$/, '')

/**
 * Extracts the vim25 fault of a failed SOAP call.
 *
 * The fault type (`FileLocked`, `InvalidDeviceSpec`, `ManagedObjectNotFound`, ...) is the only part
 * a caller can branch on: `faultstring` and `localizedMessage` are meant for humans and change with
 * the locale of the server.
 *
 * Two sources are used, in order of reliability:
 * 1. `rawError.root`, the envelope parsed by node-soap ( see `wsdl.xmlToObject`, which throws on a
 *    fault and whose error is stored there by node-soap)
 * 2. the raw response body, when the parsing itself failed
 *
 * @param {unknown} rawError - the error passed by node-soap to its callback
 * @returns {{ code?: string, faultcode?: string, faultstring?: string, localizedMessage?: string, body?: string }}
 */
export function parseFault(rawError) {
  const fault = rawError?.root?.Envelope?.Body?.Fault
  const rawBody = rawError?.response?.data ?? rawError?.body
  const body = typeof rawBody === 'string' && rawBody !== '<stream>' ? rawBody : undefined

  let code, localizedMessage
  let faultcode = valueOf(fault?.faultcode)
  let faultstring = valueOf(fault?.faultstring)

  const detail = fault?.detail
  if (detail !== null && typeof detail === 'object') {
    // the single child of `detail` names the fault, e.g.
    // `<InvalidDeviceSpecFault xsi:type="InvalidDeviceSpec">`
    for (const [name, value] of Object.entries(detail)) {
      if (name === 'attributes') {
        continue
      }
      code = value?.attributes?.['xsi:type'] ?? faultTypeOfElementName(name)
      localizedMessage = valueOf(value?.localizedMessage)
      break
    }
  }

  if (body !== undefined) {
    if (faultstring === undefined) {
      const matches = body.match(/<faultstring[^>]*>([\s\S]*?)<\/faultstring>/i)
      if (matches !== null) {
        faultstring = unescapeXml(matches[1])
      }
    }
    if (faultcode === undefined) {
      const matches = body.match(/<faultcode[^>]*>([\s\S]*?)<\/faultcode>/i)
      if (matches !== null) {
        faultcode = unescapeXml(matches[1])
      }
    }
    if (code === undefined) {
      const matches = body.match(/<detail>\s*<([^\s/>]+)/i)
      if (matches !== null) {
        code = faultTypeOfElementName(matches[1])
      }
    }
    if (localizedMessage === undefined) {
      const matches = body.match(/<localizedMessage[^>]*>([\s\S]*?)<\/localizedMessage>/i)
      if (matches !== null) {
        localizedMessage = unescapeXml(matches[1])
      }
    }
  }

  return { code, faultcode, faultstring, localizedMessage, body }
}
