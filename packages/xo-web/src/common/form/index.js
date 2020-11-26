import BaseComponent from 'base-component'
import classNames from 'classnames'
import defined from '@xen-orchestra/defined'
import Icon from 'icon'
import map from 'lodash/map'
import PropTypes from 'prop-types'
import randomPassword from 'random-password'
import React from 'react'
import round from 'lodash/round'
import SingleLineRow from 'single-line-row'
import { Container, Col } from 'grid'
import { DropdownButton, MenuItem } from 'react-bootstrap-4/lib'

import Button from '../button'
import Component from '../base-component'
import getEventValue from '../get-event-value'
import { formatSizeRaw, parseSize } from '../utils'

export Number from './number'
export Select from './select'

// ===================================================================

export class Password extends Component {
  static propTypes = {
    defaultVisible: PropTypes.bool,
    enableGenerator: PropTypes.bool,
  }

  state = {
    visible: this.props.defaultVisible,
  }

  get value() {
    return this.refs.field.value
  }

  set value(value) {
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
      visible: true,
    })
  }

  _toggleVisibility = () => {
    this.setState({
      visible: !this.state.visible,
    })
  }

  render() {
    const { className, defaultVisible, enableGenerator = false, ...props } = this.props
    const { visible } = this.state

    return (
      <div className='input-group'>
        {enableGenerator && (
          <span className='input-group-btn'>
            <Button onClick={this._generate}>
              <Icon icon='password' />
            </Button>
          </span>
        )}
        <input
          {...props}
          className={classNames(className, 'form-control')}
          ref='field'
          type={visible ? 'text' : 'password'}
        />
        <span className='input-group-btn'>
          <Button onClick={this._toggleVisibility}>
            <Icon icon={visible ? 'shown' : 'hidden'} />
          </Button>
        </span>
      </div>
    )
  }
}

// ===================================================================

export class Range extends Component {
  static propTypes = {
    max: PropTypes.number.isRequired,
    min: PropTypes.number.isRequired,
    onChange: PropTypes.func,
    required: PropTypes.bool,
    step: PropTypes.number,
    value: PropTypes.number,
  }

  componentDidMount() {
    const { min, onChange, required, value } = this.props

    if (value === undefined && required) {
      onChange !== undefined && onChange(min)
    }
  }

  _onChange = value => this.props.onChange(getEventValue(value))

  render() {
    const { max, min, step, value } = this.props

    return (
      <Container>
        <SingleLineRow>
          <Col size={2}>{value !== undefined && <span className='pull-right'>{value}</span>}</Col>
          <Col size={10}>
            <input
              className='form-control'
              max={max}
              min={min}
              onChange={this._onChange}
              step={step}
              type='range'
              value={value !== undefined ? value : min}
            />
          </Col>
        </SingleLineRow>
      </Container>
    )
  }
}

export Toggle from './toggle'

const UNITS = ['kiB', 'MiB', 'GiB']
const DEFAULT_UNIT = 'GiB'

export class SizeInput extends BaseComponent {
  static propTypes = {
    autoFocus: PropTypes.bool,
    className: PropTypes.string,
    defaultUnit: PropTypes.oneOf(UNITS),
    defaultValue: PropTypes.number,
    onChange: PropTypes.func,
    placeholder: PropTypes.string,
    readOnly: PropTypes.bool,
    required: PropTypes.bool,
    style: PropTypes.object,
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf([null])]),
  }

  constructor(props) {
    super(props)

    this.state = this._createStateFromBytes(defined(props.value, props.defaultValue, null))
  }

  componentWillReceiveProps(props) {
    const { value } = props
    if (value !== undefined && value !== this.props.value) {
      this.setState(this._createStateFromBytes(value))
    }
  }

  _createStateFromBytes(bytes) {
    if (bytes === this._bytes) {
      return {
        input: this._input,
        unit: this._unit,
      }
    }

    if (bytes === null) {
      return {
        input: '',
        unit: this.props.defaultUnit || DEFAULT_UNIT,
      }
    }

    const { prefix, value } = formatSizeRaw(bytes)
    return {
      input: String(round(value, 2)),
      unit: `${prefix}B`,
    }
  }

  get value() {
    const { input, unit } = this.state

    if (!input) {
      return null
    }

    return parseSize(`${+input} ${unit}`)
  }

  set value(value) {
    if (process.env.NODE_ENV !== 'production' && this.props.value !== undefined) {
      throw new Error('cannot set value of controlled SizeInput')
    }
    this.setState(this._createStateFromBytes(value))
  }

  _onChange(input, unit) {
    const { onChange } = this.props

    // Empty input equals null.
    const bytes = input ? parseSize(`${+input} ${unit}`) : null

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

    if (Number.isNaN(number)) {
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

  render() {
    const { autoFocus, className, readOnly, placeholder, required, style } = this.props

    return (
      <span className={classNames('input-group', className)} style={style}>
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
          <DropdownButton bsStyle='secondary' id='size' pullRight disabled={readOnly} title={this.state.unit}>
            {map(UNITS, unit => (
              <MenuItem key={unit} onClick={() => this._updateUnit(unit)}>
                {unit}
              </MenuItem>
            ))}
          </DropdownButton>
        </span>
      </span>
    )
  }
}
