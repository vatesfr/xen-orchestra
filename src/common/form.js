import classNames from 'classnames'
import Icon from 'icon'
import randomPassword from 'random-password'
import React, { Component } from 'react'
import { autobind, propTypes } from 'utils'

// ===================================================================

@propTypes({
  enableGenerator: propTypes.bool
})
export class Password extends Component {
  constructor (props) {
    super(props)
    this.state = {}
  }

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
      enableGenerator = true,
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
  step: propTypes.number,
  value: propTypes.number,
  onChange: propTypes.func
})
export class Range extends Component {
  constructor (props) {
    super(props)
    this.state = {
      value: props.value || props.min
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
