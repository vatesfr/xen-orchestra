export async function scan({ host }) {
  await this.getXapi(host).call('PUSB.scan', host._xapiRef)
}

scan.params = {
  host: { type: 'string' },
}
scan.resolve = {
  host: ['host', 'host', 'operate'],
}

export async function set({ pusb, enabled }) {
  const xapi = this.getXapi(pusb)

  if (enabled !== undefined && enabled !== pusb.passthroughEnabled) {
    await xapi.call('PUSB.set_passthrough_enabled', pusb._xapiRef, enabled)
  }
}

set.params = {
  id: { type: 'string' },
  enabled: { type: 'boolean', optional: true },
}

set.resolve = {
  pusb: ['id', 'PUSB', 'administrate'],
}
