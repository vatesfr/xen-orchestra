import classNames from 'classnames'
import Icon from 'icon'
import map from 'lodash/map'
import randomPassword from 'random-password'
import React from 'react'
import {
  DropdownButton,
  MenuItem
} from 'react-bootstrap-4/lib'

import Component from '../base-component'
import {
  autobind,
  formatSizeRaw,
  parseSize,
  propTypes
} from '../utils'

export Select from './select'

// ===================================================================

@propTypes({
  enableGenerator: propTypes.bool
})
export class Password extends Component {
  get value () {
    return this.refs.field.value
  }

  set value (value) {
    this.refs.field.value = value
  }

  @autobind
  _generate () {
    this.refs.field.value = randomPassword(8)
    this.setState({
      visible: true
    })
  }

  @autobind
  _toggleVisibility () {
    this.setState({
      visible: !this.state.visible
    })
  }

  render () {
    const {
      className,
      enableGenerator = false,
      ...props
    } = this.props
    const { visible } = this.state

    return <div className='input-group'>
      {enableGenerator && <span className='input-group-btn'>
        <button type='button' className='btn btn-secondary' onClick={this._generate}>
          <Icon icon='password' />
        </button>
      </span>}
      <input
        {...props}
        className={classNames(className, 'form-control')}
        ref='field'
        type={visible ? 'text' : 'password'}
      />
      <span className='input-group-btn'>
        <button type='button' className='btn btn-secondary' onClick={this._toggleVisibility}>
          <Icon icon={visible ? 'shown' : 'hidden'} />
        </button>
      </span>
    </div>
  }
}

// ===================================================================

@propTypes({
  defaultValue: propTypes.number,
  max: propTypes.number.isRequired,
  min: propTypes.number.isRequired,
  step: propTypes.number,
  onChange: propTypes.func
})
export class Range extends Component {
  constructor (props) {
    super()
    this.state = {
      value: props.defaultValue || props.min
    }
  }

  get value () {
    return this.state.value
  }

  set value (value) {
    const { onChange } = this.props
    this.state.value = +value

    if (onChange) {
      onChange(value)
    }
  }

  @autobind
  _handleChange (event) {
    const { onChange } = this.props
    const { value } = event.target

    if (value === this.state.value) {
      return
    }

    this.setState({
      value
    }, onChange && (() => onChange(value)))
  }

  render () {
    const {
      props
    } = this
    const step = props.step || 1
    const { value } = this.state

    return (
      <div className='form-group row'>
        <label className='col-sm-2 control-label'>
          {value}
        </label>
        <div className='col-sm-10'>
          <input
            className='form-control'
            type='range'
            min={props.min}
            max={props.max}
            step={step}
            value={value}
            onChange={this._handleChange}
          />
        </div>
      </div>
    )
  }
}

const TOGGLE_STYLE = { visibility: 'hidden' }

@propTypes({
  defaultValue: propTypes.bool,
  onChange: propTypes.func,
  value: propTypes.bool
})
export class Toggle extends Component {
  get value () {
    return this.refs.input.checked
  }

  set value (value) {
    this.refs.input.checked = Boolean(value)
  }

  componentWillReceiveProps (nextProps) {
    const { value } = nextProps
    if (value !== this.props.value) {
      this.value = value
    }
  }

  _onChange = () => {
    this.forceUpdate()

    const { onChange } = this.props
    onChange && onChange(this.value)
  }

  render () {
    const { props, refs } = this
    const { input } = refs
    const {
      defaultValue = false,
      value = input ? input.checked : defaultValue
    } = props

    return <label className={props.disabled ? 'text-muted' : value ? 'text-success' : null}>
      <Icon icon={`toggle-${value ? 'on' : 'off'}`} size={2} />
      <input
        checked={value}
        defaultChecked={defaultValue}
        disabled={props.disabled}
        onChange={this._onChange}
        ref='input'
        style={TOGGLE_STYLE}
        type='checkbox'
      />
    </label>
  }
}

const UNITS = ['kiB', 'MiB', 'GiB']
const DEFAULT_UNIT = 'GiB'
@propTypes({
  autoFocus: propTypes.bool,
  className: propTypes.string,
  defaultUnit: propTypes.oneOf(UNITS),
  defaultValue: propTypes.number,
  onChange: propTypes.func,
  placeholder: propTypes.string,
  readOnly: propTypes.bool,
  style: propTypes.object
})
export class SizeInput extends Component {
  constructor (props) {
    super(props)

    const humanSize = props.defaultValue && formatSizeRaw(props.defaultValue)
    this._defaultValue = humanSize && humanSize.value
    this.state = { unit: humanSize ? humanSize.prefix + 'B' : props.defaultUnit || DEFAULT_UNIT }
  }

  get value () {
    const value = this.refs.value.value
    return value ? parseSize(value + ' ' + this.state.unit) : undefined
  }

  set value (newValue) {
    const humanSize = newValue && formatSizeRaw(newValue)
    this.refs.value.value = humanSize ? humanSize.value : ''
    this.setState({ unit: humanSize ? humanSize.prefix + 'B' : DEFAULT_UNIT })
  }

  _onChange = () =>
    this.props.onChange && this.props.onChange(this.value)

  _updateUnit = unit => {
    this.setState({ unit })
    this._onChange()
  }

  render () {
    const {
      autoFocus,
      className,
      placeholder,
      readOnly,
      style
    } = this.props

    return <span
      className={classNames(className, 'input-group')}
      style={style}
    >
      <input
        autoFocus={autoFocus}
        className='form-control'
        defaultValue={this._defaultValue}
        min={0}
        onChange={this._onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        ref='value'
        type='number'
      />
      <span className='input-group-btn'>
        <DropdownButton
          bsStyle='secondary'
          disabled={readOnly}
          id='size'
          pullRight
          title={this.state.unit}
        >
          {map(UNITS, unit =>
            <MenuItem
              key={unit}
              onClick={() => this._updateUnit(unit)}
            >
              {unit}
            </MenuItem>
          )}
        </DropdownButton>
      </span>
    </span>
  }
}
