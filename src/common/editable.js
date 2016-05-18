import Icon from 'icon'
import isFunction from 'lodash/isFunction'
import isString from 'lodash/isString'
import React from 'react'

import Component from './base-component'
import { propTypes } from './utils'

const LONG_CLICK = 400

@propTypes({
  alt: propTypes.node.isRequired
})
class Hover extends Component {
  constructor () {
    super()

    this.state = {
      hover: false
    }

    this._onMouseEnter = () => this.setState({ hover: true })
    this._onMouseLeave = () => this.setState({ hover: false })
  }

  render () {
    if (this.state.hover) {
      return <a onMouseLeave={this._onMouseLeave}>
        {this.props.alt}
      </a>
    }

    return <a onMouseEnter={this._onMouseEnter}>
      {this.props.children}
    </a>
  }
}

@propTypes({
  children: propTypes.string.isRequired,
  onChange: propTypes.func.isRequired,
  onUndo: propTypes.oneOf([
    propTypes.bool,
    propTypes.func
  ])
})
export class Text extends Component {
  _closeEdition = () => {
    this.setState({ editing: false })
  }

  _openEdition = () => {
    this.setState({
      editing: true,
      error: null,
      saving: false
    })
  }

  _undo = () => {
    const { onUndo } = this.props
    if (onUndo === false) {
      return
    }

    return this._save(this.state.previous, isFunction(onUndo) && onUndo)
  }

  async _save (value, fn) {
    const { props } = this

    const previous = props.children
    if (value === previous) {
      return this._closeEdition()
    }

    this.setState({ saving: true })

    try {
      await (fn || props.onChange)(value)

      this.setState({ previous })
      this._closeEdition()
    } catch (error) {
      this.setState({
        error: isString(error) ? error : error.message,
        saving: false
      })
    }
  }

  _onKeyDown = event => {
    const { keyCode } = event
    if (keyCode === 27) {
      return this._closeEdition()
    }

    if (keyCode === 13) {
      return this._save(event.target.value)
    }
  }
  _onInput = ({ target }) => {
    target.style.width = `${target.value.length + 1}ex`
  }

  _startTimer = (event) => (this._timeout = setTimeout(() => {
    event.preventDefault()
    this._openEdition()
  }, LONG_CLICK))
  _clearTimer = () => clearTimeout(this._timeout)

  render () {
    const { state } = this

    if (!state.editing) {
      const { onUndo, previous } = state
      const { useLongClick } = this.props

      const success = <Icon icon='success' />

      return <span className='no-click'>
        <span
          onMouseDown={useLongClick && this._startTimer}
          onMouseUp={useLongClick && this._clearTimer}
          onClick={!useLongClick && this._openEdition}
        >
          {this.props.children}
        </span>
        {previous != null && (onUndo !== false
          ? <Hover alt={<Icon icon='undo' onClick={this._undo} />}>
            {success}
          </Hover>
          : success
        )}
      </span>
    }

    const { children } = this.props
    const { error, saving } = state

    return <span>
      <input
        autoFocus
        defaultValue={children}
        onBlur={this._closeEdition}
        onInput={this._onInput}
        onKeyDown={this._onKeyDown}
        readOnly={saving}
        style={{
          width: `${children.length + 1}ex`
        }}
        type='text'
      />
      {saving && <span>{' '}<Icon icon='loading' /></span>}
      {error != null && <span>{' '}<Icon icon='error' title={error} /></span>}
    </span>
  }
}
