import React from 'react'

import Component from '../base-component'
import Icon from '../icon'
import propTypes from '../prop-types'

const TOGGLE_STYLE = { visibility: 'hidden' }

@propTypes({
  defaultValue: propTypes.bool,
  onChange: propTypes.func,
  value: propTypes.bool
})
export default class Toggle extends Component {
  get value () {
    const { props } = this

    const { value } = props
    if (value != null) {
      return value
    }

    const { input } = this.refs
    if (input) {
      return input.checked
    }

    return props.defaultValue || false
  }

  set value (value) {
    if (process.env.NODE_ENV !== 'production') {
      if (this.props.value != null) {
        throw new Error('cannot set value of controlled Toggle')
      }
    }

    this.refs.input.checked = Boolean(value)
  }

  _onChange = event => {
    if (this.props.value == null) {
      this.forceUpdate()
    }

    const { onChange } = this.props
    onChange && onChange(event.target.checked)
  }

  render () {
    const { props, value } = this

    return <label className={props.disabled ? 'text-muted' : value ? 'text-success' : null}>
      <Icon icon={`toggle-${value ? 'on' : 'off'}`} size='lg' />
      <input
        checked={props.value}
        defaultChecked={props.defaultChecked}
        disabled={props.disabled}
        onChange={this._onChange}
        ref='input'
        style={TOGGLE_STYLE}
        type='checkbox'
      />
    </label>
  }
}
