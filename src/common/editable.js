import _ from 'messages'
import findKey from 'lodash/findKey'
import Icon from 'icon'
import isFunction from 'lodash/isFunction'
import isString from 'lodash/isString'
import map from 'lodash/map'
import React from 'react'
import round from 'lodash/round'

import Component from './base-component'
import { DropdownButton, MenuItem } from 'react-bootstrap-4/lib'
import { formatSize, formatSizeRaw, parseSize, propTypes } from './utils'

const LONG_CLICK = 400
const UNITS = ['kiB', 'MiB', 'GiB']

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
  onChange: propTypes.func.isRequired,
  onUndo: propTypes.oneOfType([
    propTypes.bool,
    propTypes.func
  ]),
  useLongClick: propTypes.bool,
  value: propTypes.any.isRequired
})
class Editable extends Component {
  _onKeyDown = event => {
    const { keyCode } = event
    if (keyCode === 27) {
      return this._closeEdition()
    }

    if (keyCode === 13) {
      // this._value should always be the value which is ready to be saved
      return this._save(this._value)
    }
  }

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

    const previous = props.value || props.children
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

  _startTimer = event => {
    event.persist()
    this._timeout = setTimeout(() => {
      event.preventDefault()
      this._openEdition()
    }, LONG_CLICK)
  }
  _stopTimer = () => clearTimeout(this._timeout)

  render () {
    const { state, props } = this

    if (!state.editing) {
      const { onUndo, previous } = state
      const { useLongClick } = props

      const success = <Icon icon='success' />

      return <span ref='mainDisplay'>
        <span
          onClick={!useLongClick && this._openEdition}
          onMouseDown={useLongClick && this._startTimer}
          onMouseUp={useLongClick && this._stopTimer}
        >
          {this._renderDisplay()}
        </span>
        {previous != null && (onUndo !== false
          ? <Hover alt={<Icon icon='undo' onClick={this._undo} />}>
            {success}
          </Hover>
          : success
        )}
      </span>
    }

    const { error, saving } = state

    return <span ref='mainEdition'>
      {this._renderEdition()}
      {saving && <span>{' '}<Icon icon='loading' /></span>}
      {error != null && <span>{' '}<Icon icon='error' title={error} /></span>}
    </span>
  }
}

@propTypes({
  children: propTypes.string,
  value: propTypes.string.isRequired
})
export class Text extends Editable {
  constructor (props) {
    super()

    this._value = props.children
  }

  _onInput = ({ target }) => {
    target.style.width = `${target.value.length + 1}ex`
    this._value = this.refs.input.value
  }

  _renderDisplay () {
    const { useLongClick, children, value } = this.props

    return <span className={!children && !value && 'text-muted'}>
      {this.props.children ||
        this.props.value ||
        this.props.placeholder ||
        (useLongClick ? _('editableLongClickPlaceholder') : _('editableClickPlaceholder'))
      }
    </span>
  }

  _renderEdition () {
    const { children } = this.props
    const { saving } = this.state

    return <input
      autoFocus
      defaultValue={children}
      onBlur={this._closeEdition}
      onInput={this._onInput}
      onKeyDown={this._onKeyDown}
      readOnly={saving}
      ref='input'
      style={{
        width: `${children.length + 1}ex`
      }}
      type='text'
    />
  }
}

@propTypes({
  children: propTypes.any,
  labelProp: propTypes.string.isRequired,
  options: propTypes.oneOfType([
    propTypes.array,
    propTypes.object
  ]).isRequired,
  value: propTypes.any.isRequired
})
export class Select extends Editable {
  constructor (props) {
    super()

    this._value = props.value
    this._defaultValue = findKey(props.options, option => option === this._value)
  }

  _onChange = event => {
    this._value = this.props.options[event.target.value]
    this._save(this._value)
  }
  _optionToJsx = (option, index) => {
    const { labelProp } = this.props
    return <option
      key={index}
      value={index}
    >
      {labelProp ? option[labelProp] : option}
    </option>
  }
  _autoOpen = ref => {
    // Seems to work in Google Chrome (not in Firefox)
    ref && ref.dispatchEvent(new window.MouseEvent('mousedown'))
  }

  _style = {padding: '0px'}

  _renderDisplay = () => this.props.children ||
    <span>{this.props.value[this.props.labelProp]}</span>

  _renderEdition () {
    const { saving } = this.state
    const { options } = this.props

    return <select
      autoFocus
      className='form-control'
      defaultValue={this._defaultValue}
      onBlur={this._closeEdition}
      onChange={this._onChange}
      onKeyDown={this._onKeyDown}
      readOnly={saving}
      ref={this._autoOpen}
      style={this._style}
    >
      {map(options, this._optionToJsx)}
    </select>
  }
}

@propTypes({
  children: propTypes.string,
  value: propTypes.number.isRequired
})
export class Size extends Editable {
  constructor (props) {
    super()

    this._value = props.value

    const humanSize = formatSizeRaw(this._value)
    this.state = {
      sizeNumber: round(humanSize.value, 1),
      sizeUnit: humanSize.prefix + 'B'
    }
  }

  _updateNumber = () => {
    this.setState({ sizeNumber: this.refs.value.value })
    this._value = this.refs.value.value ? parseSize(this.refs.value.value + ' ' + this.state.sizeUnit) : 0
  }
  _updateUnit = sizeUnit => {
    this.setState({ sizeUnit })
    this._value = parseSize(this.state.sizeNumber + ' ' + sizeUnit)
  }

  _renderDisplay () {
    return this.props.children || formatSize(this.props.value)
  }

  _renderEdition () {
    const {
      saving,
      sizeNumber,
      sizeUnit
    } = this.state

    return <span className='input-group' style={{width: '6em'}} onKeyDown={this._onKeyDown}>
      <input
        autoFocus
        className='form-control'
        defaultValue={sizeNumber}
        onChange={this._updateNumber}
        readOnly={saving}
        ref='value'
        step={0.1}
        type='number'
      />
      <span className='input-group-btn'>
        <DropdownButton
          title={sizeUnit}
          id='size'
          bsStyle='secondary'
        >
          {map(UNITS, unit => <MenuItem key={unit} onClick={() => this._updateUnit(unit)}>{unit}</MenuItem>)}
        </DropdownButton>
      </span>
    </span>
  }
}
