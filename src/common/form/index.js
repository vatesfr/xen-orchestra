import BaseComponent from 'base-component'
import classNames from 'classnames'
import Icon from 'icon'
import map from 'lodash/map'
import randomPassword from 'random-password'
import React from 'react'
import round from 'lodash/round'
import SingleLineRow from 'single-line-row'
import { Container, Col } from 'grid'
import {
  DropdownButton,
  MenuItem
} from 'react-bootstrap-4/lib'

import Component from '../base-component'
import getEventValue from '../get-event-value'
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
    const value = randomPassword(8)
    const isControlled = this.props.value !== undefined
    if (isControlled) {
      this.props.onChange(value)
    } else {
      this.refs.field.value = value
    }

    // FIXME: in controlled mode, visibility should only be updated
    // when the value prop is changed according to the emitted value.
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
  max: propTypes.number.isRequired,
  min: propTypes.number.isRequired,
  onChange: propTypes.func,
  step: propTypes.number,
  value: propTypes.number
})
export class Range extends Component {
  componentDidMount () {
    const { min, onChange, value } = this.props

    if (!value) {
      onChange && onChange(min)
    }
  }

  _onChange = value =>
    this.props.onChange(getEventValue(value))

  render () {
    const { max, min, step, value } = this.props

    return <Container>
      <SingleLineRow>
        <Col size={2}>
          <span className='pull-right'>{value}</span>
        </Col>
        <Col size={10}>
          <input
            className='form-control'
            max={max}
            min={min}
            onChange={this._onChange}
            step={step}
            type='range'
            value={value}
          />
        </Col>
      </SingleLineRow>
    </Container>
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
    propTypes.oneOf([ null ])
  ])
})
export class SizeInput extends BaseComponent {
  constructor (props) {
    super(props)

    this.state = this._createStateFromBytes(firstDefined(props.value, props.defaultValue, null))
  }

  componentWillReceiveProps (props) {
    const { value } = props
    if (value !== undefined && value !== this.props.value) {
      this.setState(this._createStateFromBytes(value))
    }
  }

  _createStateFromBytes (bytes) {
    if (bytes === this._bytes) {
      return {
        input: this._input,
        unit: this._unit
      }
    }

    if (bytes === null) {
      return {
        input: '',
        unit: this.props.defaultUnit || DEFAULT_UNIT
      }
    }

    const { prefix, value } = formatSizeRaw(bytes)
    return {
      input: String(round(value, 2)),
      unit: `${prefix}B`
    }
  }

  get value () {
    const { input, unit } = this.state

    if (!input) {
      return null
    }

    return parseSize(`${+input} ${unit}`)
  }

  set value (value) {
    if (
      process.env.NODE_ENV !== 'production' &&
      this.props.value !== undefined
    ) {
      throw new Error('cannot set value of controlled SizeInput')
    }
    this.setState(this._createStateFromBytes(value))
  }

  _onChange (input, unit) {
    const { onChange } = this.props

    // Empty input equals null.
    const bytes = input
      ? parseSize(`${+input} ${unit}`)
      : null

    const isControlled = this.props.value !== undefined
    if (isControlled) {
      // Store input and unit for this change to update correctly on new
      // props.
      this._bytes = bytes
      this._input = input
      this._unit = unit
    } else {
      this.setState({ input, unit })

      // onChange is optional in uncontrolled mode.
      if (!onChange) {
        return
      }
    }

    onChange(bytes)
  }

  _updateNumber = event => {
    const input = event.target.value

    if (!input) {
      return this._onChange(input, this.state.unit)
    }

    const number = +input

    // NaN: do not ack this change.
    if (number !== number) { // eslint-disable-line no-self-compare
      return
    }

    // Same numeric value: simply update the input.
    const prevInput = this.state.input
    if (prevInput && +prevInput === number) {
      return this.setState({ input })
    }

    this._onChange(input, this.state.unit)
  }

  _updateUnit = unit => {
    const { input } = this.state

    // 0 is always 0, no matter the unit.
    if (+input) {
      this._onChange(input, unit)
    } else {
      this.setState({ unit })
    }
  }

  render () {
    const {
      autoFocus,
      className,
      readOnly,
      placeholder,
      required,
      style
    } = this.props

    return <span className={classNames('input-group', className)} style={style}>
      <input
        autoFocus={autoFocus}
        className='form-control'
        disabled={readOnly}
        onChange={this._updateNumber}
        placeholder={placeholder}
        required={required}
        type='text'
        value={this.state.input}
      />
      <span className='input-group-btn'>
        <DropdownButton
          bsStyle='secondary'
          id='size'
          pullRight
          disabled={readOnly}
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
