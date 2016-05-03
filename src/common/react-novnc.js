import React, { Component } from 'react'
import { propTypes } from 'utils'
import { RFB } from 'novnc-node'
import {
  format as formatUrl,
  parse as parseUrl,
  resolve as resolveUrl
} from 'url'

const parseRelativeUrl = url => parseUrl(resolveUrl(String(window.location), url))

const PROTOCOL_ALIASES = {
  'http:': 'ws:',
  'https:': 'wss:'
}
const fixProtocol = url => {
  const protocol = PROTOCOL_ALIASES[url.protocol]
  if (protocol) {
    url.protocol = protocol
  }
}

@propTypes({
  onClipboardChange: propTypes.func,
  url: propTypes.string.isRequired
})
export default class NoVnc extends Component {
  constructor (props) {
    super(props)

    this._rfb = null
  }

  _clean () {
    const rfb = this._rfb
    if (rfb) {
      this._rfb = null
      rfb.disconnect()
    }
  }

  _focus () {
    const rfb = this._rfb
    if (rfb) {
      const { activeElement } = document
      if (activeElement) {
        activeElement.blur()
      }

      rfb.get_keyboard().grab()
      rfb.get_mouse().grab()
    }
  }

  _unfocus () {
    const rfb = this._rfb
    if (rfb) {
      rfb.get_keyboard().ungrab()
      rfb.get_mouse().ungrab()
    }
  }

  componentDidMount () {
    this._clean()

    const url = parseRelativeUrl(this.props.url)
    fixProtocol(url)

    const isSecure = url.protocol === 'wss:'

    const { onClipboardChange } = this.props
    const rfb = this._rfb = new RFB({
      encrypt: isSecure,
      target: this.refs.canvas,
      wsProtocols: [ 'chat' ],
      onClipboardChange: onClipboardChange && ((_, text) => {
        onClipboardChange(text)
      })
    })
    rfb.connect(formatUrl(url))
  }

  componentWillUnmount () {
    this._clean()
  }

  render () {
    return <canvas
      className='center-block'
      height='480'
      onMouseEnter={() => this._focus()}
      onMouseLeave={() => this._unfocus()}
      ref='canvas'
      width='640'
    />
  }
}
