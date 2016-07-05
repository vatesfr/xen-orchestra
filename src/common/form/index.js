import BaseComponent from 'base-component'
import classNames from 'classnames'
import Icon from 'icon'
import map from 'lodash/map'
import randomPassword from 'random-password'
import React from 'react'
import round from 'lodash/round'
import {
  DropdownButton,
  MenuItem
} from 'react-bootstrap-4/lib'

import Component from '../base-component'
import propTypes from '../prop-types'
import {
  firstDefined,
  formatSizeRaw,
  parseSize
} from '../utils'

export Select from './select'
export SelectPlainObject from './select-plain-object'

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

  _generate = () => {
    this.refs.field.value = randomPassword(8)
    this.setState({
      visible: true
    })
  }

  _toggleVisibility = () => {
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

  _handleChange = event => {
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

export Toggle from './toggle'

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
  required: propTypes.bool,
  style: propTypes.object,
  value: propTypes.number
})
export class SizeInput extends BaseComponent {
  constructor (props) {
    super(props)

    this.state = this._createState(formatSizeRaw(firstDefined(props.value, props.defaultValue, 0)))
  }

  componentWillReceiveProps (newProps) {
    const { value } = newProps
    if (value !== this.props.value && value !== this.state.bytes || 0) {
      this.setState({
        ...this._createState(formatSizeRaw(value)),
        bytes: undefined
      })
    }
  }

  _createState = humanSize => {
    const { defaultUnit } = this.props
    return {
      unit: humanSize && humanSize.value ? humanSize.prefix + 'B' : defaultUnit || DEFAULT_UNIT,
      value: humanSize ? round(humanSize.value, 3) : ''
    }
  }

  get value () {
    const { unit, value } = this.state
    return value ? parseSize(value + ' ' + unit) : undefined
  }

  set value (newValue) {
    if (
      process.env.NODE_ENV !== 'production' &&
      this.props.value != null
    ) {
      throw new Error('cannot set value of controlled SizeInput')
    }
    this.setState(this._createState(
      formatSizeRaw(newValue || 0)
    ))
  }

  _onChange = () =>
    this.props.onChange && this.props.onChange(this.value)

  _updateValue = event => {
    const { value } = event.target
    if (this.props.value != null) {
      this.setState({
        value,
        bytes: parseSize((value || 0) + ' ' + this.state.unit)
      }, () => this._onChange())
    } else {
      this._onChange()
    }
  }
  _updateUnit = unit =>
    this.setState({ unit }, () => this._onChange())

  render () {
    const {
      autoFocus,
      className,
      placeholder,
      readOnly,
      required,
      style
    } = this.props

    const {
      value,
      unit
    } = this.state

    return <span
      className={classNames(className, 'input-group')}
      style={style}
    >
      <input
        autoFocus={autoFocus}
        className='form-control'
        min={0}
        onChange={this._updateValue}
        placeholder={placeholder}
        readOnly={readOnly}
        required={required}
        type='number'
        value={value || ''}
      />
      <span className='input-group-btn'>
        <DropdownButton
          bsStyle='secondary'
          disabled={readOnly}
          id='size'
          pullRight
          title={unit}
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
