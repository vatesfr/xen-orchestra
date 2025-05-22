import PropTypes from 'prop-types'
import React, { Component } from 'react'
import RFB from '@nraynaud/novnc/lib/rfb'
import URL from 'url-parse'
import { createBackoff } from 'jsonrpc-websocket-client'
import { enable as enableShortcuts, disable as disableShortcuts } from 'shortcuts'

const PROTOCOL_ALIASES = {
  'http:': 'ws:',
  'https:': 'wss:',
}
const fixProtocol = url => {
  const protocol = PROTOCOL_ALIASES[url.protocol]
  if (protocol) {
    url.protocol = protocol
  }
}

export default class NoVnc extends Component {
  static propTypes = {
    onClipboardChange: PropTypes.func,
    url: PropTypes.string.isRequired,
  }

  constructor(props) {
    super(props)
    this._rfb = null
    this._retryGen = createBackoff(Infinity)

    this._onUpdateState = (rfb, state) => {
      if (state === 'normal') {
        if (this._retryTimeout) {
          clearTimeout(this._retryTimeout)
          this._retryTimeout = undefined
          this._retryGen = createBackoff(Infinity)
        }
      }

      if (state !== 'disconnected' || this.refs.canvas == null) {
        return
      }

      clearTimeout(this._retryTimeout)
      this._retryTimeout = setTimeout(this._connect, this._retryGen.next().value)
    }
  }

  sendCtrlAltDel() {
    const rfb = this._rfb
    if (rfb) {
      rfb.sendCtrlAltDel()
    }
  }

  setClipboard(text) {
    const rfb = this._rfb
    if (rfb) {
      rfb.clipboardPasteFrom(text)
    }
  }

  _clean() {
    const rfb = this._rfb
    if (rfb) {
      this._rfb = null
      rfb.disconnect()
    }
    enableShortcuts()
  }

  _connect = () => {
    this._clean()

    const { canvas } = this.refs
    if (!canvas) {
      return
    }

    const url = new URL(this.props.url)
    fixProtocol(url)

    const isSecure = url.protocol === 'wss:'

    const { onClipboardChange } = this.props
    const rfb = (this._rfb = new RFB({
      encrypt: isSecure,
      target: this.refs.canvas,
      onClipboard:
        onClipboardChange &&
        ((_, text) => {
          onClipboardChange(text)
        }),
      onUpdateState: this._onUpdateState,
    }))

    // remove leading slashes from the path
    //
    // a leading slash will be added by noVNC
    const clippedPath = url.pathname.replace(/^\/+/, '')

    // a port is required
    //
    // if not available from the URL, use the default ones
    const port = url.port || (isSecure ? 443 : 80)

    rfb.connect(url.hostname, port, null, clippedPath)
    disableShortcuts()
  }

  componentDidMount() {
    this._connect()
  }

  componentWillUnmount() {
    this._clean()
  }

  componentWillReceiveProps(props) {
    const rfb = this._rfb
    if (rfb && this.props.scale !== props.scale) {
      rfb.get_display().set_scale(props.scale || 1)
      rfb.get_mouse().set_scale(props.scale || 1)
    }
  }

  _focus = () => {
    const rfb = this._rfb
    if (rfb) {
      const { activeElement } = document
      if (activeElement) {
        activeElement.blur()
      }

      rfb.get_keyboard().grab()
      rfb.get_mouse().grab()

      disableShortcuts()
    }
  }

  _unfocus = () => {
    const rfb = this._rfb
    if (rfb) {
      rfb.get_keyboard().ungrab()
      rfb.get_mouse().ungrab()

      enableShortcuts()
    }
  }

  render() {
    return (
      <canvas
        className='center-block'
        height='480'
        onMouseEnter={this._focus}
        onMouseLeave={this._unfocus}
        ref='canvas'
        width='640'
      />
    )
  }
}
