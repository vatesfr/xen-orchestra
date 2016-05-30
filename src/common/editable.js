import _ from 'messages'
import findKey from 'lodash/findKey'
import Icon from 'icon'
import isFunction from 'lodash/isFunction'
import isString from 'lodash/isString'
import map from 'lodash/map'
import React from 'react'
import round from 'lodash/round'
import { DropdownButton, MenuItem } from 'react-bootstrap-4/lib'

import Component from './base-component'
import { formatSize, formatSizeRaw, parseSize, propTypes } from './utils'

const LONG_CLICK = 400
const SELECT_STYLE = { padding: '0px' }
const SIZE_STYLE = { width: '10rem' }
const UNITS = ['kiB', 'MiB', 'GiB']
const EDITABLE_STYLE = { borderBottom: '1px dashed #ccc' }

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
      return <span onMouseLeave={this._onMouseLeave}>
        {this.props.alt}
      </span>
    }

    return <span onMouseEnter={this._onMouseEnter}>
      {this.props.children}
    </span>
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
      return this._save(this.value)
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

    const previous = props.value
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
      return <span style={useLongClick ? null : EDITABLE_STYLE}>
        <span
          onClick={!useLongClick && this._openEdition}
          onMouseDown={useLongClick && this._startTimer}
          onMouseUp={useLongClick && this._stopTimer}
        >
          {this._renderDisplay()}
        </span>
        {previous != null && (onUndo !== false
          ? <Hover
            alt={<a onClick={this._undo}><Icon icon='undo' /></a>}
          >
            {success}
          </Hover>
          : success
        )}
      </span>
    }

    const { error, saving } = state

    return <span>
      {this._renderEdition()}
      {saving && <span>{' '}<Icon icon='loading' /></span>}
      {error != null && <span>{' '}<Icon icon='error' title={error} /></span>}
    </span>
  }
}

@propTypes({
  value: propTypes.string.isRequired
})
export class Text extends Editable {
  get value () {
    return this.refs.input.value
  }

  _onInput = ({ target }) => {
    target.style.width = `${target.value.length + 1}ex`
  }

  _renderDisplay () {
    const {
      children,
      value
    } = this.props

    if (children || value) {
      return <span> {children || value} </span>
    }

    const {
      placeholder,
      useLongClick
    } = this.props

    return <span className='text-muted'>
      {placeholder ||
        (useLongClick ? _('editableLongClickPlaceholder') : _('editableClickPlaceholder'))
      }
    </span>
  }

  _renderEdition () {
    const { value } = this.props
    const { saving } = this.state

    return <input
      autoFocus
      defaultValue={value}
      onBlur={this._closeEdition}
      onInput={this._onInput}
      onKeyDown={this._onKeyDown}
      readOnly={saving}
      ref='input'
      style={{
        width: `${value.length + 1}ex`
      }}
      type='text'
    />
  }
}

@propTypes({
  value: propTypes.number.isRequired
})
export class Number extends Component {
  get value () {
    return +this.refs.input.value
  }

  _onChange = value => this.props.onChange(+value)

  render () {
    return <Text
      {...this.props}
      onChange={this._onChange}
      value={String(this.props.value)}
    />
  }
}

@propTypes({
  labelProp: propTypes.string.isRequired,
  options: propTypes.oneOfType([
    propTypes.array,
    propTypes.object
  ]).isRequired
})
export class Select extends Editable {
  constructor (props) {
    super()

    this._defaultValue = findKey(props.options, option => option === props.value)
  }

  get value () {
    return this.props.options[this._select.value]
  }

  _onChange = event => {
    this._save(this.props.options[event.target.value])
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

  _onEditionMount = ref => {
    this._select = ref
    // Seems to work in Google Chrome (not in Firefox)
    ref && ref.dispatchEvent(new window.MouseEvent('mousedown'))
  }

  _renderDisplay () {
    return this.props.children ||
      <span>{this.props.value[this.props.labelProp]}</span>
  }

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
      ref={this._onEditionMount}
      style={SELECT_STYLE}
    >
      {map(options, this._optionToJsx)}
    </select>
  }
}

@propTypes({
  value: propTypes.number.isRequired
})
export class Size extends Editable {
  get value () {
    const { sizeNumber, sizeUnit } = this.state
    return sizeNumber ? parseSize(sizeNumber + ' ' + sizeUnit) : 0
  }

  componentWillReceiveProps () {
    const humanSize = formatSizeRaw(this.props.value)
    this.setState({
      sizeNumber: round(humanSize.value, 1),
      sizeUnit: humanSize.prefix + 'B'
    })
  }

  _updateNumber = () => {
    this.setState({ sizeNumber: this.refs.value.value })
  }
  _updateUnit = sizeUnit => {
    this.setState({ sizeUnit })
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

    return <span
      className='input-group'
      onBlur={this._closeEdition}
      onKeyDown={this._onKeyDown}
      style={SIZE_STYLE}
    >
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
