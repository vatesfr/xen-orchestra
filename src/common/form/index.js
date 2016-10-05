import BaseComponent from 'base-component'
import classNames from 'classnames'
import Icon from 'icon'
import isNaN from 'lodash/isNaN'
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
    this.setState({
      value: +value
    })
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
  value: propTypes.oneOfType([
    propTypes.number,
    propTypes.oneOf([ null, NaN ])
  ])
})
export class SizeInput extends BaseComponent {
  constructor (props) {
    super(props)

    this.state = this._createStateFromBytes(firstDefined(props.value, props.defaultValue))
  }

  componentWillReceiveProps (newProps) {
    const { value } = newProps
    if (value === undefined || value === this.props.value || isNaN(value) && isNaN(this.props.value)) {
      return
    }

    const { _bytes, _unit, _number } = this
    this._bytes = this._unit = this._number = null
    // No value
    if (value === null) {
      this.setState({
        unit: firstDefined(_unit, this.props.defaultUnit, DEFAULT_UNIT),
        number: ''
      })
      return
    }

    if (isNaN(value) || value === _bytes) {
      // value has changed because the SizeInput has been edited: no formatting
      this.setState({
        unit: _unit,
        number: _number
      })
    } else {
      // value has changed because the prop has been set: formatting
      this.setState(this._createStateFromBytes(value))
    }
  }

  _createStateFromBytes = bytes => {
    const humanSize = bytes != null && formatSizeRaw(bytes)
    return {
      unit: humanSize && humanSize.value ? humanSize.prefix + 'B' : this.props.defaultUnit || DEFAULT_UNIT,
      number: humanSize ? round(humanSize.value, 3) : ''
    }
  }

  get value () {
    const { unit, number } = this.state
    return this._parseSize(number, unit)
  }

  _parseSize = (number, unit) => {
    try {
      return parseSize(number + ' ' + unit)
    } catch (_) {}
  }

  set value (newValue) {
    if (
      process.env.NODE_ENV !== 'production' &&
      this.props.value != null
    ) {
      throw new Error('cannot set value of controlled SizeInput')
    }
    this.setState(this._createStateFromBytes(newValue))
  }

  _onChange = value =>
    this.props.onChange && this.props.onChange(value)

  _updateValue = event => {
    const newNumber = event.target.value
    if (this.props.value !== undefined) {
      this._number = newNumber
      this._unit = this.state.unit
      if (newNumber === '') {
        this._bytes = null
      } else {
        const bytes = this._parseSize(newNumber, this.state.unit)
        this._bytes = bytes === undefined ? NaN : bytes
      }

      this._onChange(this._bytes)
    } else {
      this.setState({ number: newNumber }, () => {
        this._onChange(this.value)
      })
    }
  }
  _updateUnit = newUnit => {
    if (this.props.value !== undefined) {
      this._number = this.state.number
      this._unit = newUnit
      if (this.state.number === '') {
        this._bytes = null
      } else {
        const bytes = this._parseSize(this.state.number, newUnit)
        this._bytes = bytes === undefined ? NaN : bytes
      }

      this._onChange(this._bytes)
    } else {
      this.setState({ unit: newUnit }, () => {
        this._onChange(this.value)
      })
    }
  }

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
      number,
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
        pattern='[0-9.]+'
        placeholder={placeholder}
        readOnly={readOnly}
        required={required}
        value={number}
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
