import _ from 'intl'
import React from 'react'
import { createBrowserMedia, attachBrowserMedia, disconnectBrowserMedia, getBrowserMediaEnabled } from './xo'

// Owned by the page, not the console component: navigating within XO must not
// interrupt an installation. A reload/tab close intentionally disconnects it.
const sessions = new Map()
const listeners = new Set()
const changed = () => listeners.forEach(listener => listener())

async function connect(vm, file) {
  if (sessions.has(vm.id)) return
  const state = { status: 'browserMediaConnecting', name: file.name }
  sessions.set(vm.id, state)
  changed()
  try {
    const session = await createBrowserMedia(vm, file)
    state.id = session.id
    const url = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}${session.socket}`
    const socket = (state.socket = new window.WebSocket(url))
    socket.binaryType = 'arraybuffer'
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Connection timed out'))
        socket.close()
      }, 15000)
      socket.onerror = () => {
        clearTimeout(timer)
        reject(new Error('Cannot connect virtual media'))
      }
      socket.onclose = () => {
        clearTimeout(timer)
        if (state.error === undefined) state.status = 'browserMediaDisconnected'
        state.disconnected = true
        changed()
        reject(new Error('Media disconnected'))
      }
      socket.onmessage = async ({ data }) => {
        try {
          const request = JSON.parse(data)
          if (request.ready) {
            clearTimeout(timer)
            resolve()
            return
          }
          const { id, offset, length } = request
          if (
            !Number.isInteger(id) ||
            id < 0 ||
            id > 0xffffffff ||
            !Number.isSafeInteger(offset) ||
            !Number.isInteger(length) ||
            offset < 0 ||
            length < 1 ||
            length > 1024 * 1024 ||
            offset + length > file.size
          ) {
            throw new Error('Invalid media read')
          }
          const bytes = await file.slice(offset, offset + length).arrayBuffer()
          if (bytes.byteLength !== length) throw new Error('Short media read')
          const reply = new Uint8Array(length + 4)
          new DataView(reply.buffer).setUint32(0, id)
          reply.set(new Uint8Array(bytes), 4)
          if (socket.readyState === window.WebSocket.OPEN) socket.send(reply)
        } catch (_) {
          socket.close()
        }
      }
    })
    await attachBrowserMedia(state.id)
    if (socket.readyState !== window.WebSocket.OPEN) throw new Error('Media disconnected')
    state.status = 'browserMediaConnected'
  } catch (error) {
    state.socket?.close()
    if (state.id !== undefined) disconnectBrowserMedia(state.id).catch(() => {})
    state.status = 'browserMediaFailed'
    state.error = error.message
    state.disconnected = true
  }
  changed()
}

export default class LocalIso extends React.Component {
  state = { enabled: false }
  _refresh = () => this.forceUpdate()
  componentDidMount() {
    this._mounted = true
    listeners.add(this._refresh)
    getBrowserMediaEnabled()
      .then(enabled => {
        if (this._mounted) this.setState({ enabled })
      })
      .catch(() => {})
  }
  componentWillUnmount() {
    this._mounted = false
    listeners.delete(this._refresh)
  }
  _select = event => {
    const file = event.target.files[0]
    event.target.value = ''
    if (file !== undefined) connect(this.props.vm, file)
  }
  _disconnect = async () => {
    const state = sessions.get(this.props.vm.id)
    if (state === undefined || state.disconnecting) return
    state.disconnecting = true
    changed()
    // Explicit API disconnect reports cleanup failures; socket close still makes
    // the ISO unavailable immediately and triggers server-side cleanup retries.
    try {
      if (state.id !== undefined && !state.disconnected) await disconnectBrowserMedia(state.id)
      sessions.delete(this.props.vm.id)
    } catch (error) {
      state.status = 'browserMediaCleanupPending'
      state.error = error.message
      state.disconnected = true
    } finally {
      state.disconnecting = false
      state.socket?.close()
      changed()
    }
  }
  render() {
    if (!this.state.enabled) return null
    const state = sessions.get(this.props.vm.id)
    return (
      <div className='m-t-1'>
        {state === undefined ? (
          <label>
            {_('browserMediaConnect')}
            <input
              type='file'
              accept='.iso'
              disabled={!['Running', 'Halted'].includes(this.props.vm.power_state)}
              onChange={this._select}
            />
          </label>
        ) : (
          <span>
            <span role='status'>{_(state.status, { name: state.name, error: state.error })} </span>
            {state.id !== undefined || state.disconnected ? (
              <button
                type='button'
                className='btn btn-secondary btn-sm'
                disabled={state.disconnecting}
                onClick={this._disconnect}
              >
                {_(state.disconnected ? 'browserMediaDismiss' : 'browserMediaDisconnect')}
              </button>
            ) : null}
          </span>
        )}
      </div>
    )
  }
}
