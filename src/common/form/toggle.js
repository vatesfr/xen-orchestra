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
        checked={props.value}
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
