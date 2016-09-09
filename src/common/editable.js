import findKey from 'lodash/findKey'
import isFunction from 'lodash/isFunction'
import isString from 'lodash/isString'
import map from 'lodash/map'
import pick from 'lodash/pick'
import React from 'react'

import _ from './intl'
import Component from './base-component'
import Icon from './icon'
import logError from './log-error'
import propTypes from './prop-types'
import Tooltip from './tooltip'
import { formatSize } from './utils'
import { SizeInput } from './form'
import {
  SelectHost,
  SelectIp,
  SelectNetwork,
  SelectPool,
  SelectRemote,
  SelectSr,
  SelectSubject,
  SelectTag,
  SelectVm,
  SelectVmTemplate
} from './select-objects'

const LONG_CLICK = 400
const SELECT_STYLE = { padding: '0px' }
const SIZE_STYLE = { width: '10rem' }
const EDITABLE_STYLE = {
  borderBottom: '1px dashed #ccc',
  cursor: 'context-menu'
}
const LONG_EDITABLE_STYLE = {
  cursor: 'context-menu'
}

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
  get value () {
    throw new Error('not implemented')
  }

  _onKeyDown = event => {
    const { keyCode } = event
    if (keyCode === 27) {
      return this._closeEdition()
    }

    if (keyCode === 13) {
      return this._save()
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
    const { props } = this
    const { onUndo } = props
    if (onUndo === false) {
      return
    }

    return this.__save(
      () => this.state.previous,
      isFunction(onUndo) ? onUndo : props.onChange
    )
  }

  _save () {
    return this.__save(
      () => this.value,
      this.props.onChange
    )
  }

  async __save (getValue, saveValue) {
    const { props } = this

    try {
      const value = getValue()
      const previous = props.value
      if (value === previous) {
        return this._closeEdition()
      }

      this.setState({ saving: true })

      await saveValue(value)

      this.setState({ previous })
      this._closeEdition()
    } catch (error) {
      this.setState({
        error: isString(error) ? error : error.message,
        saving: false
      })
      logError(error)
    }
  }

  __startTimer = event => {
    event.persist()
    this._timeout = setTimeout(() => {
      event.preventDefault()
      this._openEdition()
    }, LONG_CLICK)
  }
  __stopTimer = () => clearTimeout(this._timeout)

  render () {
    const { state, props } = this

    if (!state.editing) {
      const { onUndo, previous } = state
      const { useLongClick } = props

      const success = <Icon icon='success' />
      return <span style={useLongClick ? LONG_EDITABLE_STYLE : EDITABLE_STYLE}>
        <span
          onClick={!useLongClick && this._openEdition}
          onMouseDown={useLongClick && this.__startTimer}
          onMouseUp={useLongClick && this.__stopTimer}
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
      {error != null && <span>
        {' '}<Tooltip content={error}><Icon icon='error' /></Tooltip>
      </span>}
    </span>
  }
}

@propTypes({
  autoComplete: propTypes.string,
  maxLength: propTypes.number,
  minLength: propTypes.number,
  pattern: propTypes.string,
  value: propTypes.string.isRequired
})
export class Text extends Editable {
  get value () {
    const { input } = this.refs

    // FIXME: should be properly forwarded to the user.
    const error = input.validationMessage
    if (error) {
      throw new Error(error)
    }

    return input.value
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

    // Optional props that the user may set on the input.
    const extraProps = pick(this.props, [
      'autoComplete',
      'maxLength',
      'minLength',
      'pattern'
    ])

    return <input
      {...extraProps}

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
      type={this._isPassword ? 'password' : 'text'}
    />
  }
}

export class Password extends Text {
  // TODO: this is a hack, this class should probably have a better
  // implementation.
  _isPassword = true
}

@propTypes({
  nullable: propTypes.bool,
  value: propTypes.number
})
export class Number extends Component {
  get value () {
    return +this.refs.input.value
  }

  _onChange = value => {
    if (value === '') {
      if (this.props.nullable) {
        value = null
      } else {
        return
      }
    } else {
      value = +value
    }

    this.props.onChange(value)
  }

  render () {
    const { value } = this.props
    return <Text
      {...this.props}
      onChange={this._onChange}
      value={value === null ? '' : String(value)}
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
    this._save()
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

const MAP_TYPE_SELECT = {
  host: SelectHost,
  ip: SelectIp,
  network: SelectNetwork,
  pool: SelectPool,
  remote: SelectRemote,
  SR: SelectSr,
  subject: SelectSubject,
  tag: SelectTag,
  VM: SelectVm,
  'VM-template': SelectVmTemplate
}

@propTypes({
  labelProp: propTypes.string.isRequired,
  predicate: propTypes.func,
  value: propTypes.oneOfType([
    propTypes.string,
    propTypes.object
  ]).isRequired
})
export class XoSelect extends Editable {
  get value () {
    return this.refs.select.value
  }

  _renderDisplay () {
    return this.props.children ||
      <span>{this.props.value[this.props.labelProp]}</span>
  }

  _onChange = object => {
    object ? this._save() : this._closeEdition()
  }

  _renderEdition () {
    const {
      placeholder,
      predicate,
      saving,
      xoType
    } = this.props

    const Select = MAP_TYPE_SELECT[xoType]
    if (process.env.NODE_ENV !== 'production') {
      if (!Select) {
        throw new Error(`${xoType} is not a valid XoSelect type.`)
      }
    }

    // Anchor is needed so that the BlockLink does not trigger a redirection
    // when this element is clicked.
    return <a onBlur={this._closeEdition}>
      <Select
        autoFocus
        disabled={saving}
        onChange={this._onChange}
        placeholder={placeholder}
        predicate={predicate}
        ref='select'
      />
    </a>
  }
}

@propTypes({
  value: propTypes.number.isRequired
})
export class Size extends Editable {
  get value () {
    return this.refs.input.value
  }

  _renderDisplay () {
    return this.props.children || formatSize(this.props.value)
  }

  _closeEditionIfUnfocused = () => {
    this._focused = false
    setTimeout(() => {
      !this._focused && this._closeEdition()
    }, 10)
  }

  _focus = () => { this._focused = true }

  _renderEdition () {
    const { saving } = this.state
    const { value } = this.props

    return <span
      onBlur={this._closeEditionIfUnfocused}
      onFocus={this._focus}
      onKeyDown={this._onKeyDown}
    >
      <SizeInput
        autoFocus
        ref='input'
        readOnly={saving}
        style={SIZE_STYLE}
        defaultValue={value}
      />
    </span>
  }
}
